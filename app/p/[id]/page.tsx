"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Plane, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Trip { id: number; name: string; description?: string; start_date: string; end_date: string }
interface Stop { id: number; city_name: string; country: string; arrival_date: string; departure_date: string }
interface Activity { id: number; trip_stop_id: number; name: string; estimated_cost: number; duration_hours: number; scheduled_date?: string | null; scheduled_time?: string | null; category?: string }

export default function PublicTripPage(){
  const params = useParams()
  const tripId = params?.id as string
  const [trip, setTrip] = useState<Trip | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    ;(async()=>{
      try{
        const res = await fetch(`/api/public/trips/${tripId}`)
        if(!res.ok){ setTrip(null); return }
        const data = await res.json()
        setTrip(data.trip)
        setStops(data.stops || [])
        setActivities(data.activities || [])
      } finally { setLoading(false) }
    })()
  },[tripId])

  const byStop = useMemo(()=>{
    const map: Record<number, Activity[]> = {}
    for(const a of activities){
      if(!map[a.trip_stop_id]) map[a.trip_stop_id] = []
      map[a.trip_stop_id].push(a)
    }
    return map
  },[activities])

  if(loading){
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading public itinerary…</div>
  }
  if(!trip){
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">This trip is not public or does not exist.</h2>
          <Link href="/trips"><Button className="mt-2">Go to My Trips</Button></Link>
        </div>
      </div>
    )
  }

  const formatDate = (d:string)=> new Date(d).toLocaleDateString()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
            <Link href="/trips"><Button variant="outline">Open App</Button></Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{trip.name}</h1>
          </div>
          {trip.description && <p className="text-gray-600">{trip.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Dates</h3>
              <p className="text-sm text-gray-600">{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Stops</h3>
              <p className="text-2xl font-bold text-green-600">{stops.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Activities</h3>
              <p className="text-2xl font-bold">{activities.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Itinerary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stops.map((s)=> (
                <div key={s.id} className="rounded border">
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                    <div className="font-semibold">{s.city_name}, {s.country}</div>
                    <div className="text-sm text-gray-600">{formatDate(s.arrival_date)} - {formatDate(s.departure_date)}</div>
                  </div>
                  <div className="p-3 space-y-2">
                    {(byStop[s.id]||[]).length===0 && (
                      <div className="text-sm text-gray-500">No activities added.</div>
                    )}
                    {(byStop[s.id]||[]).map((a)=> (
                      <div key={a.id} className="flex items-center justify-between text-sm border rounded px-3 py-2 bg-white">
                        <div>
                          <div className="font-medium">{a.name}</div>
                          <div className="text-gray-600">{a.category || 'Activity'} • {a.duration_hours}h{a.scheduled_date?` • ${a.scheduled_date}`:""}{a.scheduled_time?` ${a.scheduled_time}`:""}</div>
                        </div>
                        <div className="font-semibold">${a.estimated_cost}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
