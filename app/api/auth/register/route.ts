import { type NextRequest, NextResponse } from "next/server"
import { dbHelpers } from "@/lib/database"
import { authHelpers } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const { email, password, first_name, last_name, phone_number, city, country, profile_image } = userData

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await dbHelpers.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 409 })
    }

    // Hash password
    const password_hash = await authHelpers.hashPassword(password)

    // Create user
    const result = await dbHelpers.createUser({
      email,
      password_hash,
      first_name,
      last_name,
      phone_number,
      city,
      country,
      profile_image,
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.lastInsertRowid,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
