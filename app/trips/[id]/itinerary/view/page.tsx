"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plane, ArrowLeft, Calendar, MapPin, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Stop { id: number; city_id: number; city_name: string; country: string; arrival_date: string; departure_date: string }
interface Activity { id: number; name: string; estimated_cost: number; duration_hours: number; scheduled_date?: string | null; scheduled_time?: string | null; category?: string }

export default function ItineraryViewPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params?.id as string

  const [stops, setStops] = useState<Stop[]>([])
  const [byStopActivities, setByStopActivities] = useState<Record<number, Activity[]>>({})
  const [mode, setMode] = useState<"list" | "calendar">("list")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [dragging, setDragging] = useState<{ stopId: number; activityId: number } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/auth/login"); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/stops`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error("Failed to load stops")
        const data = await res.json()
        const s: Stop[] = (data.stops || []).map((x: any) => ({
          id: x.id,
          city_id: x.city_id,
          city_name: x.city_name,
          country: x.country,
          arrival_date: x.arrival_date,
          departure_date: x.departure_date,
        }))
        setStops(s)
        // Load activities per stop
        const entries: Record<number, Activity[]> = {}
        for (const st of s) {
          const ar = await fetch(`/api/trips/stops/${st.id}/activities`, { headers: { Authorization: `Bearer ${token}` } })
          if (ar.ok) {
            const d = await ar.json()
            entries[st.id] = (d.activities || [])
          } else {
            entries[st.id] = []
          }
        }
        setByStopActivities(entries)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [tripId])

  const daysForStop = (stop: Stop) => {
    const start = new Date(stop.arrival_date)
    const end = new Date(stop.departure_date)
    const days: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().slice(0, 10))
    }
    return days
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={`/trips/${tripId}`} className="mr-4"><ArrowLeft className="h-6 w-6 text-gray-600" /></Link>
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/profile"><Button variant="ghost" size="sm">Profile</Button></Link>
              <Button variant={mode==="list"?"default":"outline"} onClick={()=>setMode("list")}><List className="h-4 w-4 mr-1"/>List</Button>
              <Button variant={mode==="calendar"?"default":"outline"} onClick={()=>setMode("calendar")}><Calendar className="h-4 w-4 mr-1"/>Calendar</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold mb-4">Itinerary</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading itinerary...</div>
        ) : stops.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-600">No stops yet. Build your plan first.</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {stops.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {s.city_name}, {s.country}
                    <span className="text-gray-500 text-sm">({new Date(s.arrival_date).toLocaleDateString()} - {new Date(s.departure_date).toLocaleDateString()})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mode === "list" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(byStopActivities[s.id] || []).map((a) => (
                        <div key={a.id} className="rounded border p-3">
                          <div className="font-medium">{a.name}</div>
                          <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3 mt-1">
                            <span>{a.duration_hours}h</span>
                            <span>${a.estimated_cost}</span>
                            <label className="flex items-center gap-1">
                              <span className="text-gray-500">Date</span>
                              <input
                                type="date"
                                className="border rounded px-2 py-1 text-xs"
                                value={a.scheduled_date || ""}
                                onChange={async (e)=>{
                                  const token = localStorage.getItem("token")
                                  if (!token) { router.push("/auth/login"); return }
                                  setSavingId(a.id)
                                  try {
                                    const body = { id: a.id, scheduled_date: e.target.value || null }
                                    await fetch(`/api/trips/stops/${s.id}/activities`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                                    setByStopActivities((prev)=>({
                                      ...prev,
                                      [s.id]: (prev[s.id]||[]).map(x=> x.id===a.id?{...x, scheduled_date: e.target.value || null}:x)
                                    }))
                                  } finally { setSavingId(null) }
                                }}
                              />
                            </label>
                            <label className="flex items-center gap-1">
                              <span className="text-gray-500">Time</span>
                              <input
                                type="time"
                                className="border rounded px-2 py-1 text-xs"
                                value={a.scheduled_time || ""}
                                onChange={async (e)=>{
                                  const token = localStorage.getItem("token")
                                  if (!token) { router.push("/auth/login"); return }
                                  setSavingId(a.id)
                                  try {
                                    const body = { id: a.id, scheduled_time: e.target.value || null }
                                    await fetch(`/api/trips/stops/${s.id}/activities`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                                    setByStopActivities((prev)=>({
                                      ...prev,
                                      [s.id]: (prev[s.id]||[]).map(x=> x.id===a.id?{...x, scheduled_time: e.target.value || null}:x)
                                    }))
                                  } finally { setSavingId(null) }
                                }}
                              />
                            </label>
                            {savingId===a.id && <span className="text-xs text-gray-400">Saving…</span>}
                          </div>
                        </div>
                      ))}
                      {(byStopActivities[s.id] || []).length === 0 && (
                        <div className="text-sm text-gray-500">No activities assigned.</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-500 mb-1">Tip: Drag activities to different days to reschedule.</div>
                      {daysForStop(s).map((d) => (
                        <div
                          key={d}
                          className="rounded border p-3"
                          onDragOver={(e)=>{ e.preventDefault() }}
                          onDrop={async (e)=>{
                            e.preventDefault()
                            if (!dragging) return
                            const token = localStorage.getItem("token")
                            if (!token) { router.push("/auth/login"); return }
                            try {
                              const { stopId, activityId } = dragging
                              if (stopId !== s.id) return // only allow within same stop for now
                              setSavingId(activityId)
                              await fetch(`/api/trips/stops/${s.id}/activities`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ id: activityId, scheduled_date: d })
                              })
                              setByStopActivities((prev)=>({
                                ...prev,
                                [s.id]: (prev[s.id]||[]).map(x=> x.id===activityId?{...x, scheduled_date: d}:x)
                              }))
                            } finally {
                              setSavingId(null)
                              setDragging(null)
                            }
                          }}
                        >
                          <div className="font-medium mb-2">{new Date(d).toDateString()}</div>
                          <div className="space-y-2 min-h-8">
                            {(byStopActivities[s.id] || []).filter(a => a.scheduled_date === d).map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between text-sm bg-white border rounded px-2 py-1 cursor-move"
                                draggable
                                onDragStart={()=> setDragging({ stopId: s.id, activityId: a.id })}
                              >
                                <div>
                                  <div className="font-medium">{a.name}</div>
                                  <div className="text-gray-600">{a.duration_hours}h • ${a.estimated_cost}{a.scheduled_time?` • ${a.scheduled_time}`:""}</div>
                                </div>
                              </div>
                            ))}
                            {(byStopActivities[s.id] || []).filter(a => a.scheduled_date === d).length === 0 && (
                              <div className="text-sm text-gray-500">No activities scheduled.</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
