"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface City { id: number; name: string; country: string }
interface Activity { id: number; name: string; category?: string; estimated_cost?: number; currency?: string; duration_hours?: number; tags?: string }

export default function AdminActivitiesPage() {
  const router = useRouter()
  const token = useMemo(()=> (typeof window !== 'undefined' ? localStorage.getItem("token") : null), [])
  const [cityId, setCityId] = useState<number | undefined>()
  const [citySearch, setCitySearch] = useState("")
  const [citySuggestions, setCitySuggestions] = useState<City[]>([])
  const [form, setForm] = useState({ name: "", category: "Sightseeing", price: "", currency: "INR", duration_hours: "", description: "", tags: "", image_url: "" })
  const [csv, setCsv] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingList, setLoadingList] = useState(false)

  useEffect(()=>{ if (!token) router.push("/admin/login") }, [token])

  const searchCities = async (q: string) => {
    if (!token) return [] as City[]
    const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []) as City[]
  }

  const loadActivities = async (id?: number) => {
    if (!token || !id) return
    setLoadingList(true)
    try {
      const res = await fetch(`/api/activities?city_id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setActivities(d.activities || [])
      }
    } finally { setLoadingList(false) }
  }

  const submit = async () => {
    try {
      setMsg(null); setErr(null)
      if (!token) return
      if (!cityId) throw new Error('Please select a city')
      const res = await fetch('/api/admin/activities', {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: form.price?Number(form.price):null, duration_hours: form.duration_hours?Number(form.duration_hours):null, city_id: cityId })
      })
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed')
      setMsg('Activity added')
      await loadActivities(cityId)
    } catch (e:any) { setErr(e?.message || 'Failed') }
  }

  const bulkImport = async () => {
    try {
      setMsg(null); setErr(null)
      if (!token) return
      const lines = csv.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
      const rows = [] as any[]
      for (const line of lines) {
        const [city_id, name, category, description, price, currency, duration_hours, tags, image_url] = line.split(',')
        if (!city_id || !name) continue
        rows.push({ city_id: Number(city_id), name, category, description, price: price?Number(price):null, currency, duration_hours: duration_hours?Number(duration_hours):null, tags, image_url })
      }
      if (!rows.length) throw new Error('No rows parsed')
      const res = await fetch('/api/admin/activities', { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rows }) })
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed import')
      setMsg(`Imported ${rows.length} activities`)
      await loadActivities(cityId)
    } catch (e:any) { setErr(e?.message || 'Failed') }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin: Activities</h1>
        <Button variant="outline" onClick={()=>router.push('/admin')}>Dashboard</Button>
      </div>
      {msg && <div className="text-green-600 text-sm">{msg}</div>}
      {err && <div className="text-red-600 text-sm">{err}</div>}

      <Card>
        <CardHeader><CardTitle>Add Activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>City</Label>
            <div className="relative">
              <Input placeholder="Search city by name..." value={citySearch} onChange={async (e)=>{
                const q = e.target.value
                setCitySearch(q)
                if (q.length<2) { setCitySuggestions([]); setCityId(undefined); setActivities([]); return }
                const results = await searchCities(q)
                setCitySuggestions(results.slice(0,8))
              }}/>
              {!!citySuggestions.length && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
                  {citySuggestions.map(c => (
                    <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={async ()=>{ setCityId(c.id); setCitySearch(`${c.name}, ${c.country}`); setCitySuggestions([]); await loadActivities(c.id) }}>{c.name}, {c.country}</button>
                  ))}
                </div>
              )}
            </div>
            {cityId ? (
              <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                <span>Selected City ID: {cityId}</span>
                <Button variant="outline" size="sm" onClick={()=>loadActivities(cityId)} disabled={loadingList}>Refresh List</Button>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e)=>setForm(f=>({...f, category:e.target.value}))} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e)=>setForm(f=>({...f, description:e.target.value}))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Price</Label>
              <Input type="number" value={form.price} onChange={(e)=>setForm(f=>({...f, price:e.target.value}))} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e)=>setForm(f=>({...f, currency:e.target.value}))} />
            </div>
            <div>
              <Label>Duration (hours)</Label>
              <Input type="number" value={form.duration_hours} onChange={(e)=>setForm(f=>({...f, duration_hours:e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Tags</Label>
              <Input value={form.tags} onChange={(e)=>setForm(f=>({...f, tags:e.target.value}))} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={(e)=>setForm(f=>({...f, image_url:e.target.value}))} />
            </div>
          </div>
          <Button onClick={submit}>Add</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bulk Import (CSV)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-gray-600">Format: city_id,name,category,description,price,currency,duration_hours,tags,image_url</div>
          <Textarea rows={6} value={csv} onChange={(e)=>setCsv(e.target.value)} />
          <Button onClick={bulkImport}>Import</Button>
        </CardContent>
      </Card>

      {cityId && (
        <Card>
          <CardHeader><CardTitle>Activities in this City</CardTitle></CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-sm text-gray-500">No activities found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2">Category</th>
                      <th className="py-2 pr-2">Price</th>
                      <th className="py-2 pr-2">Currency</th>
                      <th className="py-2 pr-2">Duration</th>
                      <th className="py-2 pr-2">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a)=> (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-2 pr-2">{a.name}</td>
                        <td className="py-2 pr-2">{a.category || '-'}</td>
                        <td className="py-2 pr-2">{a.estimated_cost ? `₹${a.estimated_cost.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="py-2 pr-2">{a.currency === 'INR' ? '₹' : a.currency || '-'}</td>
                        <td className="py-2 pr-2">{a.duration_hours ?? '-'}</td>
                        <td className="py-2 pr-2">{a.tags || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 