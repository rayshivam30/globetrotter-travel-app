import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = authHelpers.verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get city ID from URL params
    const cityId = parseInt(params.id, 10)
    if (isNaN(cityId)) {
      return NextResponse.json({ error: "Invalid city ID" }, { status: 400 })
    }

    // Get fields to return
    const { searchParams } = new URL(request.url)
    const fields = searchParams.get('fields')?.split(',') || []

    // Fetch city details
    const city = await dbHelpers.getCityById(cityId)
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

    // Filter fields if specified
    let result: Record<string, any> = { ...city }
    if (fields.length > 0) {
      result = {}
      for (const field of fields) {
        if (field in city) {
          result[field] = city[field as keyof typeof city]
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching city:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
