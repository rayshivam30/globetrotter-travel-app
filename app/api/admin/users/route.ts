import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

function requireAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const decoded = authHelpers.verifyToken(auth.substring(7))
  if (!decoded || !decoded.isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { decoded }
}

export async function GET(request: NextRequest) {
  const g = requireAdmin(request)
  if ("error" in g) return g.error
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") || 20)
  const offset = Number(searchParams.get("offset") || 0)
  const users = await dbHelpers.getAdminUsers(limit, offset)
  return NextResponse.json({ users })
}

export async function PATCH(request: NextRequest) {
  const g = requireAdmin(request)
  if ("error" in g) return g.error
  const body = await request.json()
  const { email, is_admin } = body || {}
  if (!email || typeof is_admin !== "boolean") {
    return NextResponse.json({ error: "email and is_admin required" }, { status: 400 })
  }
  const res = await dbHelpers.setUserAdminByEmail(String(email), Boolean(is_admin))
  return NextResponse.json({ id: res?.id, is_admin: res?.is_admin })
}

export async function DELETE(request: NextRequest) {
  const g = requireAdmin(request)
  if ("error" in g) return g.error
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  // Hard delete user by email (cascades trips)
  const user = await dbHelpers.getUserByEmail(email)
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 })
  await dbHelpers.deleteUser(user.id)
  return NextResponse.json({ success: true })
}
