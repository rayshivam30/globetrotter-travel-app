import { type NextRequest, NextResponse } from "next/server"
import { dbHelpers } from "@/lib/database"
import { authHelpers } from "@/lib/auth"
import pool from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = authHelpers.verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const tripId = parseInt(params.id)
    if (isNaN(tripId)) {
      return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 })
    }

    const trip = await dbHelpers.getTripById(tripId) as any

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if the trip belongs to the authenticated user
    if (trip.user_id !== decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get trip stops count
    const stops = await dbHelpers.getTripStops(tripId)
    const stopCount = stops.length

    // Compute live total budget from activities as a safeguard
    try {
      const live = await dbHelpers.recalcTripTotalBudget(tripId)
      if (live && typeof live.total !== 'undefined') {
        trip.total_budget = live.total
      }
    } catch (e) {
      // Non-fatal: if computation fails, fall back to stored total_budget
      console.warn('Live total budget calc failed:', e)
    }

    return NextResponse.json({
      ...trip,
      stop_count: stopCount,
    })
  } catch (error) {
    console.error("Trip fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const tripId = Number(params.id)
    const body = await request.json().catch(()=>({}))
    const fields: any = {}
    if (body.origin_city_id !== undefined) fields.origin_city_id = body.origin_city_id === null ? null : Number(body.origin_city_id)
    if (body.origin_address !== undefined) fields.origin_address = body.origin_address === null ? null : String(body.origin_address)

    if (!Object.keys(fields).length) return NextResponse.json({ error: "No changes" }, { status: 400 })

    const sets: string[] = []
    const paramsArr: any[] = []
    let idx = 1
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = $${idx++}`)
      paramsArr.push(v)
    }
    paramsArr.push(tripId)

    const sql = `UPDATE trips SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id`
    await pool.query(sql, paramsArr)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Trip origin PATCH error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
