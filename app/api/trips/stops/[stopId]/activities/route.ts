import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"
import pool from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { stopId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const stopId = Number(params.stopId)
    const items = await dbHelpers.getTripActivitiesByStop(stopId)
    return NextResponse.json({ activities: items })
  } catch (e) {
    console.error("Stop activities GET error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { stopId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const stopId = Number(params.stopId)
    const body = await request.json()
    const { id, scheduled_date, scheduled_time, notes, actual_cost } = body || {}
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    // Load current values to preserve fields not included in request
    const currentRes = await pool.query(
      'SELECT scheduled_date, scheduled_time FROM trip_activities WHERE id = $1 AND trip_stop_id = $2',
      [Number(id), stopId]
    )
    const current = currentRes.rows[0] || {}

    const hasDate = Object.prototype.hasOwnProperty.call(body, 'scheduled_date')
    const hasTime = Object.prototype.hasOwnProperty.call(body, 'scheduled_time')

    const normDate = hasDate ? (scheduled_date ? String(scheduled_date).slice(0,10) : null) : (current.scheduled_date ? String(current.scheduled_date).slice(0,10) : null)
    const normTime = hasTime ? (scheduled_time ? String(scheduled_time).slice(0,5) : null) : (current.scheduled_time ? String(current.scheduled_time).slice(0,5) : null)

    const result = await dbHelpers.updateTripActivity(Number(id), stopId, {
      scheduled_date: normDate,
      scheduled_time: normTime,
      notes: notes ?? null,
      actual_cost: actual_cost ?? null,
    })
    return NextResponse.json({ id: result.lastInsertRowid, scheduled_date: normDate, scheduled_time: normTime, success: true })
  } catch (e) {
    console.error("Stop activities PATCH error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { stopId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const stopId = Number(params.stopId)
    const body = await request.json()
    const { activity_id, scheduled_date, scheduled_time, notes, actual_cost } = body || {}
    if (!activity_id) return NextResponse.json({ error: "activity_id required" }, { status: 400 })

    const result = await dbHelpers.addTripActivity({
      trip_stop_id: stopId,
      activity_id: Number(activity_id),
      scheduled_date: scheduled_date ? String(scheduled_date).slice(0,10) : null,
      scheduled_time: scheduled_time ? String(scheduled_time).slice(0,5) : null,
      notes: notes || null,
      actual_cost: actual_cost ?? null,
    })
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
  } catch (e) {
    console.error("Stop activities POST error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { stopId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const idStr = searchParams.get("id")
    if (!idStr) return NextResponse.json({ error: "id required" }, { status: 400 })

    await dbHelpers.deleteTripActivity(Number(idStr))
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Stop activities DELETE error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
