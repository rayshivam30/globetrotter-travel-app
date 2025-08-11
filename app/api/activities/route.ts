import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import pool, { dbHelpers } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const cityId = Number(searchParams.get("city_id"))
    if (!cityId) return NextResponse.json({ error: "city_id required" }, { status: 400 })

    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined

    let sql = `SELECT * FROM activities WHERE city_id = $1`
    const params: any[] = [cityId]

    if (category) { params.push(category); sql += ` AND category = $${params.length}` }
    if (tag) { params.push(`%${tag}%`); sql += ` AND tags ILIKE $${params.length}` }
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) { params.push(maxPrice); sql += ` AND estimated_cost <= $${params.length}` }

    sql += ` ORDER BY estimated_cost NULLS LAST, name`

    const res = await pool.query(sql, params)
    return NextResponse.json({ activities: res.rows })
  } catch (e) {
    console.error("Activities by city error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 