import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const tripId = Number(params.id)
    if (Number.isNaN(tripId)) return NextResponse.json({ error: "Invalid trip id" }, { status: 400 })

    const sections = await dbHelpers.getItinerarySections(tripId)
    return NextResponse.json({ sections })
  } catch (err) {
    console.error("Itinerary GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const tripId = Number(params.id)
    if (Number.isNaN(tripId)) return NextResponse.json({ error: "Invalid trip id" }, { status: 400 })

    const body = await request.json()
    const sections = Array.isArray(body?.sections) ? body.sections : []

    // Basic validation and normalization
    const normalized = sections.map((s: any, idx: number) => ({
      title: String(s.title || `Section ${idx + 1}`),
      description: s.description ? String(s.description) : null,
      start_date: s.startDate || s.start_date || null,
      end_date: s.endDate || s.end_date || null,
      budget: s.budget !== undefined && s.budget !== null && s.budget !== "" ? Number(s.budget) : null,
      order_index: Number(s.order_index ?? idx),
    }))

    await dbHelpers.replaceItinerarySections(tripId, normalized)
    return NextResponse.json({ message: "Itinerary saved" })
  } catch (err) {
    console.error("Itinerary PUT error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
