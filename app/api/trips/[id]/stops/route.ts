import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const tripId = Number(params.id)
    const stops = await dbHelpers.getTripStops(tripId)
    return NextResponse.json({ stops })
  } catch (e) {
    console.error("Trip stops GET error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const tripId = Number(params.id)
    const body = await request.json()
    const stops = Array.isArray(body?.stops) ? body.stops : []

    const normalized = stops.map((s: any, idx: number) => ({
      city_id: Number(s.city_id),
      arrival_date: s.arrival_date || s.arrivalDate,
      departure_date: s.departure_date || s.departureDate,
      order_index: Number(s.order_index ?? idx),
    }))

    const result = await dbHelpers.replaceTripStops(tripId, normalized)
    return NextResponse.json({ message: "Stops saved", stopIds: result.stopIds })
  } catch (e) {
    console.error("Trip stops PUT error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
