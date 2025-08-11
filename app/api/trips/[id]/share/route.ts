import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const token = authHeader.substring(7)
    const decoded = authHelpers.verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const tripId = Number(params.id)
    const body = await request.json().catch(()=> ({}))
    const is_public = Boolean(body?.is_public)

    const trip = await dbHelpers.getTripById(tripId)
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (trip.user_id && trip.user_id !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await dbHelpers.setTripPublic(tripId, is_public)
    return NextResponse.json({ success: true, is_public: updated.is_public })
  } catch (e) {
    console.error("Share toggle error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
