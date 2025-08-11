"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// Lightweight currency formatter
const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0)

export default function TripBudgetPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id

  const [loading, setLoading] = useState(true)
  const [stops, setStops] = useState<any[]>([])
  const [activitiesByStop, setActivitiesByStop] = useState<Record<number, any[]>>({})

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) { router.push("/auth/login"); return }
    ;(async () => {
      try {
        // fetch stops
        const res = await fetch(`/api/trips/${tripId}/stops`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const s = data.stops || []
        setStops(s)
        // fetch activities per stop in parallel
        const pairs = await Promise.all(s.map(async (st: any) => {
          const r = await fetch(`/api/trips/stops/${st.id}/activities`, { headers: { Authorization: `Bearer ${token}` } })
          const d = await r.json()
          return [st.id, d.activities || []] as const
        }))
        const map: Record<number, any[]> = {}
        for (const [sid, acts] of pairs) map[sid] = acts
        setActivitiesByStop(map)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [tripId])

  const breakdown = useMemo(() => {
    // Heuristics: daily base cost derived from city fields if present; otherwise default
    const DEFAULT_DAILY = 100
    let totalStay = 0
    let totalActivities = 0
    const perStop: Array<{ stopId: number; city: string; days: number; stay: number; activities: number; total: number }> = []

    for (const st of stops) {
      const arr = st.arrival_date ? new Date(st.arrival_date) : null
      const dep = st.departure_date ? new Date(st.departure_date) : null
      const ms = arr && dep ? Math.max(0, dep.getTime() - arr.getTime()) : 0
      const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))

      const cityDaily = st.cost_index || st.average_daily_cost || DEFAULT_DAILY
      const stay = days * (Number(cityDaily) || DEFAULT_DAILY)

      const acts = activitiesByStop[st.id] || []
      const actSum = acts.reduce((sum: number, a: any) => sum + (Number(a.estimated_cost ?? a.cost ?? a.price ?? 0) || 0), 0)

      totalStay += stay
      totalActivities += actSum
      perStop.push({ stopId: st.id, city: `${st.city_name}${st.country ? ", " + st.country : ""}`, days, stay, activities: actSum, total: stay + actSum })
    }

    return {
      total: totalStay + totalActivities,
      totalStay,
      totalActivities,
      perStop,
    }
  }, [stops, activitiesByStop])

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading budget...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trip Budget</h1>
        <div className="flex gap-2">
          <Link href={`/trips/${tripId}/itinerary/view`}><Button variant="outline">Itinerary</Button></Link>
          <Link href={`/trips/${tripId}`}><Button variant="ghost">Trip</Button></Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Estimated Total</div>
            <div className="text-2xl font-bold">{fmt(breakdown.total)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Stay (daily base)</div>
            <div className="text-xl font-semibold">{fmt(breakdown.totalStay)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Activities</div>
            <div className="text-xl font-semibold">{fmt(breakdown.totalActivities)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Per Stop Breakdown</h2>
        <div className="space-y-3">
          {breakdown.perStop.map((row) => (
            <div key={row.stopId} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{row.city}</div>
                <div className="text-sm text-gray-600">{row.days} days</div>
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center justify-between"><span>Stay</span><span className="font-medium">{fmt(row.stay)}</span></div>
                <div className="flex items-center justify-between"><span>Activities</span><span className="font-medium">{fmt(row.activities)}</span></div>
                <div className="flex items-center justify-between"><span>Total</span><span className="font-semibold">{fmt(row.total)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-xs text-gray-500">
        Estimates use daily base from city fields if available; otherwise a default is applied. Add costs to activities to improve accuracy.
      </div>
    </div>
  )
}
