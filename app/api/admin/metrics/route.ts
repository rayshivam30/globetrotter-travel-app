import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const decoded = authHelpers.verifyToken(auth.substring(7))
  if (!decoded || !decoded.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const metrics = await dbHelpers.getAdminMetrics()
    return NextResponse.json(metrics)
  } catch (e) {
    console.error("Admin metrics error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
