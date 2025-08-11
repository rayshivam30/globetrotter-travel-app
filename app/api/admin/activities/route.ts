import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import pool from "@/lib/database"

function requireAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const decoded = authHelpers.verifyToken(auth.substring(7))
  if (!decoded || !decoded.isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { decoded }
}

let schemaEnsured = false
async function ensureActivitiesSchema() {
  if (schemaEnsured) return
  await pool.query(`
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS tags TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS activities_city_name_unique ON activities (city_id, name);
  `)
  schemaEnsured = true
}

export async function POST(request: NextRequest) {
  const g = requireAdmin(request)
  if ("error" in g) return g.error
  try {
    await ensureActivitiesSchema()
    const body = await request.json()
    const { city_id, name, category, description, price, currency, duration_hours, tags, image_url } = body || {}
    if (!city_id || !name) return NextResponse.json({ error: "city_id and name required" }, { status: 400 })

    const sql = `INSERT INTO activities (city_id, name, category, description, estimated_cost, currency, duration_hours, tags, image_url)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (city_id, name) DO UPDATE SET
                   category = EXCLUDED.category,
                   description = EXCLUDED.description,
                   estimated_cost = EXCLUDED.estimated_cost,
                   currency = EXCLUDED.currency,
                   duration_hours = EXCLUDED.duration_hours,
                   tags = EXCLUDED.tags,
                   image_url = EXCLUDED.image_url
                 RETURNING id`
    const res = await pool.query(sql, [
      Number(city_id), String(name), category || null, description || null,
      price != null ? Number(price) : null, (currency || 'USD').toUpperCase(),
      duration_hours != null ? Number(duration_hours) : null,
      tags || null, image_url || null,
    ])
    return NextResponse.json({ id: res.rows[0]?.id }, { status: 201 })
  } catch (e:any) {
    console.error("Admin add activity error", e)
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const g = requireAdmin(request)
  if ("error" in g) return g.error
  try {
    await ensureActivitiesSchema()
    const body = await request.json()
    const items: any[] = Array.isArray(body?.rows) ? body.rows : []
    if (!items.length) return NextResponse.json({ error: "rows required" }, { status: 400 })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const sql = `INSERT INTO activities (city_id, name, category, description, estimated_cost, currency, duration_hours, tags, image_url)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                   ON CONFLICT (city_id, name) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description,
                   estimated_cost = EXCLUDED.estimated_cost, currency = EXCLUDED.currency, duration_hours = EXCLUDED.duration_hours,
                   tags = EXCLUDED.tags, image_url = EXCLUDED.image_url`
      for (const r of items) {
        await client.query(sql, [
          Number(r.city_id), String(r.name), r.category || null, r.description || null,
          r.price != null ? Number(r.price) : null, (r.currency || 'USD').toUpperCase(),
          r.duration_hours != null ? Number(r.duration_hours) : null, r.tags || null, r.image_url || null,
        ])
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally { client.release() }

    return NextResponse.json({ success: true })
  } catch (e:any) {
    console.error("Admin bulk import activities error", e)
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
} 