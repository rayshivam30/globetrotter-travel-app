"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Plane } from "lucide-react"

interface User {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  city?: string | null
  country?: string | null
  profile_image?: string | null
}

export default function ProfilePage(){
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(()=>{
    const token = localStorage.getItem("token")
    if (!token) { router.push("/auth/login"); return }
    ;(async()=>{
      try{
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        if(res.ok){
          const u = await res.json()
          setUser(u)
        } else {
          router.push('/auth/login')
        }
      } catch(e){ console.error(e) }
    })()
  },[])

  const save = async ()=>{
    if(!user) return
    try{
      setSaving(true); setMsg(null); setErr(null)
      const token = localStorage.getItem("token")
      const body = {
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        phone_number: user.phone_number ?? null,
        city: user.city ?? null,
        country: user.country ?? null,
        profile_image: user.profile_image ?? null,
      }
      const res = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      if(!res.ok){ const d = await res.json().catch(()=>({})); throw new Error(d?.error || 'Save failed') }
      const updated = await res.json()
      setUser(updated)
      setMsg('Profile updated')
    }catch(e:any){ setErr(e?.message || 'Save failed') }
    finally{ setSaving(false) }
  }

  const del = async ()=>{
    if(!confirm('Delete your account? This cannot be undone.')) return
    const token = localStorage.getItem("token")
    const res = await fetch('/api/me', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if(res.ok){
      localStorage.removeItem('token')
      router.push('/auth/login')
    }
  }

  if(!user) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading profile…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/trips" className="mr-4">Back</Link>
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={save} disabled={saving}>{saving? 'Saving…':'Save'}</Button>
              <Button variant="destructive" onClick={del}>Delete Account</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {msg && <div className="mb-4 text-sm text-green-600">{msg}</div>}
        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}
        <Card>
          <CardHeader>
            <CardTitle>Profile & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={user.first_name || ''} onChange={(e)=> setUser(u=> u?{...u, first_name: e.target.value}:u)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={user.last_name || ''} onChange={(e)=> setUser(u=> u?{...u, last_name: e.target.value}:u)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={user.phone_number || ''} onChange={(e)=> setUser(u=> u?{...u, phone_number: e.target.value}:u)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={user.city || ''} onChange={(e)=> setUser(u=> u?{...u, city: e.target.value}:u)} />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={user.country || ''} onChange={(e)=> setUser(u=> u?{...u, country: e.target.value}:u)} />
              </div>
              <div className="md:col-span-2">
                <Label>Profile Image URL</Label>
                <Input value={user.profile_image || ''} onChange={(e)=> setUser(u=> u?{...u, profile_image: e.target.value}:u)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
