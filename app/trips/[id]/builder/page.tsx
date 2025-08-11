"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plane, ArrowLeft, Plus, ChevronUp, ChevronDown, Search, Calendar, MapPin, X, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface City { id: number; name: string; country: string }
interface Activity { id: number; name: string; estimated_cost: number; duration_hours: number; category?: string }

interface StopDraft {
  city: City | null
  arrivalDate: string
  departureDate: string
  notes: string
  activities: Activity[]
}

export default function BuilderPage() {
  const router = useRouter()
  const params = useParams()
  const tripId = params?.id as string

  const [stops, setStops] = useState<StopDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [activityInputs, setActivityInputs] = useState<string[]>([])
  const [cityInputs, setCityInputs] = useState<string[]>([])
  const [citySuggestions, setCitySuggestions] = useState<City[][]>([])
  const [activitySuggestions, setActivitySuggestions] = useState<Activity[][]>([])
  const [activityCategoryFilters, setActivityCategoryFilters] = useState<string[]>([])
  const [activityMaxCostFilters, setActivityMaxCostFilters] = useState<number[]>([])

  // Load existing stops and their activities
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/auth/login"); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/stops`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const baseStops: StopDraft[] = (data.stops || []).map((s: any) => ({
            city: { id: s.city_id, name: s.city_name || "", country: s.country || "" },
            arrivalDate: s.arrival_date?.slice(0,10) || "",
            departureDate: s.departure_date?.slice(0,10) || "",
            notes: "",
            activities: [],
          }))
          setStops(baseStops)
        }
      } catch (e) { console.error(e) }
    })()
  }, [tripId])

  const addStop = () => { setStops((p) => [...p, { city: null, arrivalDate: "", departureDate: "", notes: "", activities: [] }]); setActivityInputs((ai)=>[...ai, ""]) }
  const removeStop = (i: number) => { setStops((p) => p.filter((_, idx) => idx !== i)); setActivityInputs((ai)=>ai.filter((_,idx)=>idx!==i)); setCityInputs((ci)=>ci.filter((_,idx)=>idx!==i)); setCitySuggestions((cs)=>cs.filter((_,idx)=>idx!==i)); setActivitySuggestions((as)=>as.filter((_,idx)=>idx!==i)); setActivityCategoryFilters((af)=>af.filter((_,idx)=>idx!==i)); setActivityMaxCostFilters((mf)=>mf.filter((_,idx)=>idx!==i)) }
  const moveUp = (i: number) => i>0 && (setStops((p)=>{ const a=[...p]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a }), setActivityInputs((ai)=>{ const b=[...ai]; [b[i-1],b[i]]=[b[i],b[i-1]]; return b }), setCityInputs((ci)=>{ const b=[...ci]; [b[i-1],b[i]]=[b[i],b[i-1]]; return b }), setCitySuggestions((cs)=>{ const b=[...cs]; [b[i-1],b[i]]=[b[i],b[i-1]]; return b }), setActivitySuggestions((as)=>{ const b=[...as]; [b[i-1],b[i]]=[b[i],b[i-1]]; return b }), setActivityCategoryFilters((af)=>{ const b=[...af]; [b[i-1],b[i]]=[b[i],b[i-1]]; return b }), setActivityMaxCostFilters((mf)=>{ const b=[...mf]; [b[i-1],b[i]]=[b[i],b[i-1]]; return b }))
  const moveDown = (i: number) => i<stops.length-1 && (setStops((p)=>{ const a=[...p]; [a[i+1],a[i]]=[a[i],a[i+1]]; return a }), setActivityInputs((ai)=>{ const b=[...ai]; [b[i+1],b[i]]=[b[i],b[i+1]]; return b }), setCityInputs((ci)=>{ const b=[...ci]; [b[i+1],b[i]]=[b[i],b[i+1]]; return b }), setCitySuggestions((cs)=>{ const b=[...cs]; [b[i+1],b[i]]=[b[i],b[i+1]]; return b }), setActivitySuggestions((as)=>{ const b=[...as]; [b[i+1],b[i]]=[b[i],b[i+1]]; return b }), setActivityCategoryFilters((af)=>{ const b=[...af]; [b[i+1],b[i]]=[b[i],b[i+1]]; return b }), setActivityMaxCostFilters((mf)=>{ const b=[...mf]; [b[i+1],b[i]]=[b[i],b[i+1]]; return b }))

  const saveAll = async () => {
    try {
      setSaving(true); setMsg(null); setErr(null)
      const token = localStorage.getItem("token")
      if (!token) { router.push("/auth/login"); return }

      // Persist stops first
      const payload = {
        stops: stops.map((s, idx) => ({
          city_id: s.city?.id,
          arrivalDate: s.arrivalDate || null,
          departureDate: s.departureDate || null,
          order_index: idx,
        })),
      }
      const res = await fetch(`/api/trips/${tripId}/stops`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json().catch(()=>({}))
        throw new Error(d?.error || "Failed to save stops")
      }
      const saved = await res.json()
      const stopIds: number[] = saved.stopIds || []

      // Persist activities per stop if any
      for (let i = 0; i < stops.length; i++) {
        const sid = stopIds[i]
        if (!sid) continue
        for (const act of stops[i].activities) {
          await fetch(`/api/trips/stops/${sid}/activities`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ activity_id: act.id }),
          })
        }
      }
      setMsg("Saved itinerary stops and activities.")
    } catch (e:any) {
      console.error(e); setErr(e?.message || "Save failed")
    } finally { setSaving(false) }
  }

  // City search helper
  const searchCities = async (q: string) => {
    const token = localStorage.getItem("token")
    if (!token) return [] as City[]
    const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []) as City[]
  }

  // Activities search helper
  const searchActivities = async (q: string, cityId?: number) => {
    const token = localStorage.getItem("token")
    if (!token) return [] as Activity[]
    const url = `/api/activities/search?q=${encodeURIComponent(q)}${cityId?`&cityId=${cityId}`:""}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []) as Activity[]
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
              <Button variant="outline" onClick={()=>router.push(`/trips/${tripId}/itinerary/view`)}>View</Button>
              <Button onClick={saveAll} disabled={saving}>{saving?"Saving...":"Save"}</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Itinerary Builder</h2>
          <Button onClick={addStop}><Plus className="h-4 w-4 mr-1"/>Add Stop</Button>
        </div>
        {msg && <div className="mb-4 text-sm text-green-600">{msg}</div>}
        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}

        <div className="space-y-5">
          {stops.map((s, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4"/> Stop {idx+1} {s.city?`- ${s.city.name}, ${s.city.country}`:""}</CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={()=>moveUp(idx)}><ChevronUp className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={()=>moveDown(idx)}><ChevronDown className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={()=>removeStop(idx)}><X className="h-4 w-4"/></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* City selector */}
                <div>
                  <Label>City</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input placeholder="Search city..." value={cityInputs[idx] ?? (s.city?`${s.city.name}, ${s.city.country}`:"")} onChange={async (e)=>{
                        const q=e.target.value
                        setCityInputs((ci)=>{ const b=[...ci]; b[idx]=q; return b })
                        if (q.length<2) { setCitySuggestions((cs)=>{ const b=[...cs]; b[idx]=[]; return b }); return }
                        const results=await searchCities(q)
                        setCitySuggestions((cs)=>{ const b=[...cs]; b[idx]=results.slice(0,6); return b })
                      }}/>
                      {(citySuggestions[idx]?.length) ? (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
                          {citySuggestions[idx].map((c)=> (
                            <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={()=>{
                              setStops((p)=>p.map((pp,i)=> i===idx?{...pp, city: c}:pp))
                              setCitySuggestions((cs)=>{ const b=[...cs]; b[idx]=[]; return b })
                              setCityInputs((ci)=>{ const b=[...ci]; b[idx]=`${c.name}, ${c.country}`; return b })
                            }}>{c.name}, {c.country}</button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Button variant="outline" onClick={async()=>{
                      const results = await searchCities(cityInputs[idx] || "")
                      setCitySuggestions((cs)=>{ const b=[...cs]; b[idx]=results.slice(0,6); return b })
                    }}><Search className="h-4 w-4"/></Button>
                  </div>
                </div>
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Arrival</Label>
                    <div className="relative">
                      <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <Input type="date" className="pl-9" value={s.arrivalDate} onChange={(e)=>setStops((p)=>p.map((pp,i)=> i===idx?{...pp, arrivalDate: e.target.value}:pp))}/>
                    </div>
                  </div>
                  <div>
                    <Label>Departure</Label>
                    <div className="relative">
                      <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <Input type="date" className="pl-9" value={s.departureDate} onChange={(e)=>setStops((p)=>p.map((pp,i)=> i===idx?{...pp, departureDate: e.target.value}:pp))}/>
                    </div>
                  </div>
                </div>

                {/* Activities adder */}
                <div>
                  <Label>Add Activity</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative col-span-2">
                      <Input placeholder="Search activity..." value={activityInputs[idx] || ""} onChange={async (e)=>{
                        const q=e.target.value
                        setActivityInputs((ai)=>{ const b=[...ai]; b[idx]=q; return b })
                        if (q.length<2) { setActivitySuggestions((as)=>{ const b=[...as]; b[idx]=[]; return b }); return }
                        const list = await searchActivities(q, s.city?.id)
                        // apply client-side filters
                        const cat = activityCategoryFilters[idx]
                        const max = activityMaxCostFilters[idx]
                        const filtered = list.filter(a => (!cat || a.category===cat) && (!max || (a.estimated_cost ?? 0) <= max))
                        setActivitySuggestions((as)=>{ const b=[...as]; b[idx]=filtered.slice(0,8); return b })
                      }} onKeyDown={async (e:any)=>{
                        if (e.key==='Enter') {
                          const q=activityInputs[idx] || ""
                          const list = await searchActivities(q, s.city?.id)
                          const cat = activityCategoryFilters[idx]
                          const max = activityMaxCostFilters[idx]
                          const filtered = list.filter(a => (!cat || a.category===cat) && (!max || (a.estimated_cost ?? 0) <= max))
                          if (filtered[0]) setStops((p)=>p.map((pp,i)=> i===idx?{...pp, activities:[...pp.activities, filtered[0]]}:pp))
                          setActivityInputs((ai)=>{ const b=[...ai]; b[idx]=""; return b })
                          setActivitySuggestions((as)=>{ const b=[...as]; b[idx]=[]; return b })
                        }
                      }}/>
                      {(activitySuggestions[idx]?.length) ? (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto">
                          {activitySuggestions[idx].map((a)=> (
                            <button key={a.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={()=>{
                              setStops((p)=>p.map((pp,i)=> i===idx?{...pp, activities:[...pp.activities, a]}:pp))
                              setActivityInputs((ai)=>{ const b=[...ai]; b[idx]=""; return b })
                              setActivitySuggestions((as)=>{ const b=[...as]; b[idx]=[]; return b })
                            }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{a.name}</div>
                                  <div className="text-gray-600">{a.category || 'Activity'} • {a.duration_hours}h</div>
                                </div>
                                <div className="text-gray-800 font-semibold">${a.estimated_cost}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Category" value={activityCategoryFilters[idx] || ""} onChange={async (e)=>{
                        const v=e.target.value
                        setActivityCategoryFilters((af)=>{ const b=[...af]; b[idx]=v; return b })
                        // re-filter current suggestions
                        const current = activitySuggestions[idx] || []
                        if (activityInputs[idx] && activityInputs[idx].length>=2) {
                          const list = await searchActivities(activityInputs[idx], s.city?.id)
                          const max = activityMaxCostFilters[idx]
                          const filtered = list.filter(a => (!v || a.category===v) && (!max || (a.estimated_cost ?? 0) <= max))
                          setActivitySuggestions((as)=>{ const b=[...as]; b[idx]=filtered.slice(0,8); return b })
                        }
                      }}/>
                      <Input placeholder="Max Cost" type="number" value={(activityMaxCostFilters[idx] ?? "") as any} onChange={async (e)=>{
                        const v = e.target.value ? Number(e.target.value) : undefined
                        setActivityMaxCostFilters((mf)=>{ const b=[...mf]; b[idx]=v as any; return b })
                        if (activityInputs[idx] && activityInputs[idx].length>=2) {
                          const list = await searchActivities(activityInputs[idx], s.city?.id)
                          const cat = activityCategoryFilters[idx]
                          const filtered = list.filter(a => (!cat || a.category===cat) && (!v || (a.estimated_cost ?? 0) <= (v as number)))
                          setActivitySuggestions((as)=>{ const b=[...as]; b[idx]=filtered.slice(0,8); return b })
                        }
                      }}/>
                    </div>
                  </div>
                  {s.activities.length>0 && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {s.activities.map((a, ai) => (
                        <div key={ai} className="flex items-center justify-between rounded border p-2 text-sm">
                          <div>
                            <div className="font-medium">{a.name}</div>
                            <div className="text-gray-600">{a.duration_hours}h • ${a.estimated_cost}</div>
                          </div>
                          <Button size="icon" variant="ghost" onClick={()=>setStops((p)=>p.map((pp,i)=> i===idx?{...pp, activities: pp.activities.filter((_,jj)=>jj!==ai)}:pp))}><X className="h-4 w-4"/></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea rows={2} value={s.notes} onChange={(e)=>setStops((p)=>p.map((pp,i)=> i===idx?{...pp, notes: e.target.value}:pp))} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
