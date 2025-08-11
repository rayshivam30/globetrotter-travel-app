import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { imageData, fileName } = await request.json()

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${fileName || 'profile.jpg'}`
    const filePath = path.join(uploadDir, uniqueFileName)

    // Convert base64 to buffer and save
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      imageUrl: `/uploads/${uniqueFileName}`
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
