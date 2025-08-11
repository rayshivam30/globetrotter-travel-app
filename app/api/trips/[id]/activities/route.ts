import { NextResponse, type NextRequest } from "next/server"
import { authHelpers } from "@/lib/auth"
import { dbHelpers } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = authHelpers.verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const _tripId = Number(params.id)
    const body = await request.json()
    const items: Array<{ trip_stop_id: number; activity_id?: number; custom_name?: string; custom_cost?: number }>
      = Array.isArray(body?.items) ? body.items : []

    if (!items.length) return NextResponse.json({ error: "items required" }, { status: 400 })

    for (const item of items) {
      if (!item.trip_stop_id) continue
      if (item.activity_id) {
        await dbHelpers.addTripActivity({ trip_stop_id: Number(item.trip_stop_id), activity_id: Number(item.activity_id) })
      } else if (item.custom_name && typeof item.custom_cost === 'number') {
        await (dbHelpers as any).addCustomActivityInstance({
          trip_stop_id: Number(item.trip_stop_id),
          name: String(item.custom_name),
          custom_cost: Number(item.custom_cost),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Trip add activities error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 