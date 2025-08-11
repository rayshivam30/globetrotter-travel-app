import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const decoded = authHelpers.verifyToken(authHeader.substring(7))
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const user = await dbHelpers.getUserById(decoded.userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  delete (user as any).password_hash
  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const body = await request.json().catch(()=> ({}))
    const allowed = {
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      phone_number: body.phone_number ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      profile_image: body.profile_image ?? null,
    }
    await dbHelpers.updateUser(decoded.userId, allowed)
    const user = await dbHelpers.getUserById(decoded.userId)
    if (user) delete (user as any).password_hash
    return NextResponse.json(user)
  } catch (e) {
    console.error("Profile update error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    await dbHelpers.deleteUser(decoded.userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Account delete error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
