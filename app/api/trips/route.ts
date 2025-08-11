import { type NextRequest, NextResponse } from "next/server"
import { dbHelpers } from "@/lib/database"
import { authHelpers } from "@/lib/auth"

export async function GET(request: NextRequest) {
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

    const trips = await dbHelpers.getTripsByUserId(decoded.userId)
    return NextResponse.json(trips)
  } catch (error) {
    console.error("Trips fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const tripData = await request.json()
    const { name, description, start_date, end_date, cover_image } = tripData

    if (!name || !start_date || !end_date) {
      return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 })
    }

    const result = await dbHelpers.createTrip({
      user_id: decoded.userId,
      name,
      description,
      start_date,
      end_date,
      cover_image,
    })

    return NextResponse.json(
      {
        message: "Trip created successfully",
        tripId: result.lastInsertRowid,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Trip creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
