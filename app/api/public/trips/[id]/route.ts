import { NextResponse, type NextRequest } from "next/server"
import { dbHelpers } from "@/lib/database"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tripId = Number(params.id)
    const trip = await dbHelpers.getTripById(tripId)
    if (!trip || !trip.is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const stops = await dbHelpers.getTripStops(tripId)
    const activities = await dbHelpers.getTripActivitiesByTrip(tripId)
    return NextResponse.json({ trip, stops, activities })
  } catch (e) {
    console.error("Public trip fetch error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
