import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { estimateBudget } from "@/lib/budget"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const style = (searchParams.get("style") || "midrange") as any
    const miscPercent = searchParams.get("misc") ? Number(searchParams.get("misc")) : undefined
    const currency = searchParams.get("currency") || undefined

    const tripId = Number(params.id)
    const breakdown = await estimateBudget(tripId, { travelStyle: style, miscPercent, targetCurrency: currency })
    return new NextResponse(JSON.stringify(breakdown), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (e) {
    console.error("Budget GET error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 