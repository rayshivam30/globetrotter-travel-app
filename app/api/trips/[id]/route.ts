import { type NextRequest, NextResponse } from "next/server"
import { dbHelpers } from "@/lib/database"
import { authHelpers } from "@/lib/auth"

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
