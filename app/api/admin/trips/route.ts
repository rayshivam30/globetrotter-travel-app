import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const decoded = authHelpers.verifyToken(auth.substring(7))
  if (!decoded || !decoded.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") || 20)
  const offset = Number(searchParams.get("offset") || 0)

  try {
    const trips = await dbHelpers.getAdminTrips(limit, offset)
    return NextResponse.json({ trips })
  } catch (e) {
    console.error("Admin trips error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
