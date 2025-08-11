import { type NextRequest, NextResponse } from "next/server"
import { dbHelpers } from "@/lib/database"
import { authHelpers } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    let user = await dbHelpers.getUserByEmail(email) as any

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await authHelpers.comparePassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Auto-promote configured admin email
    if (email.toLowerCase() === "admin@gmail.com" && !user.is_admin) {
      await dbHelpers.setUserAdminByEmail(email, true)
      user = await dbHelpers.getUserByEmail(email) as any
    }
    const token = authHelpers.generateToken(user.id, !!user.is_admin)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: user.profile_image,
        is_admin: !!user.is_admin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
