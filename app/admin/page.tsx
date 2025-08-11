"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Metrics {
  total_users: number
  total_trips: number
  trips_by_day: { day: string; count: number }[]
  top_cities: { name: string; country: string; uses: number }[]
  top_activities: { name: string; uses: number }[]
  active_users_last_30_days: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")
  const [userPage, setUserPage] = useState(0)
  const [tripPage, setTripPage] = useState(0)
  const pageSize = 20

  const token = useMemo(()=> (typeof window !== 'undefined' ? localStorage.getItem("token") : null), [])

  useEffect(() => {
    const run = async () => {
      if (!token) { router.push("/admin/login"); return }
      try {
        const mres = await fetch(`/api/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } })
        if (mres.status === 401 || mres.status === 403) { router.push("/admin/login"); return }
        const m = await mres.json()
        setMetrics(m)
        await loadUsers(0)
        await loadTrips(0)
      } catch (e) {
        console.error("Admin load error", e)
        router.push("/admin/login")
      } finally {
        setLoading(false)
        setAuthChecked(true)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUsers = async (page: number) => {
    const res = await fetch(`/api/admin/users?limit=${pageSize}&offset=${page*pageSize}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users || [])
      setUserPage(page)
    }
  }

  const loadTrips = async (page: number) => {
    const res = await fetch(`/api/admin/trips?limit=${pageSize}&offset=${page*pageSize}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setTrips(data.trips || [])
      setTripPage(page)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading admin...</div>
  }
  if (!authChecked) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={()=>router.push("/trips")}>Back to App</Button>
              <Button variant="ghost" onClick={()=>{ localStorage.removeItem("token"); router.push("/admin/login") }}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Total Users</div><div className="text-2xl font-semibold">{metrics?.total_users ?? 0}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Total Trips</div><div className="text-2xl font-semibold">{metrics?.total_trips ?? 0}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Active (30d)</div><div className="text-2xl font-semibold">{metrics?.active_users_last_30_days ?? 0}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-sm text-gray-600">Today Trips</div><div className="text-2xl font-semibold">{metrics?.trips_by_day?.slice(-1)[0]?.count ?? 0}</div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Top Cities</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Uses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics?.top_cities?.map((c,i)=> (
                        <TableRow key={i}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.country}</TableCell>
                          <TableCell className="text-right">{c.uses}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Top Activities</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right">Uses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics?.top_activities?.map((a,i)=> (
                        <TableRow key={i}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell className="text-right">{a.uses}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Users</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={userPage===0} onClick={()=>loadUsers(userPage-1)}>Prev</Button>
                  <Button size="sm" variant="outline" onClick={()=>loadUsers(userPage+1)}>Next</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u)=> (
                      <TableRow key={u.id}>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{[u.first_name,u.last_name].filter(Boolean).join(' ') || '-'}</TableCell>
                        <TableCell>{u.is_admin? 'Yes':'No'}</TableCell>
                        <TableCell>{u.trip_count}</TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="secondary" onClick={async()=>{
                            const res = await fetch('/api/admin/users', { method:'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: u.email, is_admin: !u.is_admin }) })
                            if (res.ok) loadUsers(userPage)
                          }}>{u.is_admin? 'Revoke':'Make Admin'}</Button>
                          <Button size="sm" variant="destructive" onClick={async()=>{
                            if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return
                            const res = await fetch(`/api/admin/users?email=${encodeURIComponent(u.email)}`, { method:'DELETE', headers: { Authorization: `Bearer ${token}` } })
                            if (res.ok) loadUsers(userPage)
                          }}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trips" className="mt-4">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Trips</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={tripPage===0} onClick={()=>loadTrips(tripPage-1)}>Prev</Button>
                  <Button size="sm" variant="outline" onClick={()=>loadTrips(tripPage+1)}>Next</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Stops</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((t)=> (
                      <TableRow key={t.id}>
                        <TableCell>{t.id}</TableCell>
                        <TableCell>{t.name}</TableCell>
                        <TableCell>{t.owner_email}</TableCell>
                        <TableCell>{t.stop_count}</TableCell>
                        <TableCell>${(Number(t.total_budget||0)).toLocaleString()}</TableCell>
                        <TableCell>{t.is_public? 'Yes':'No'}</TableCell>
                        <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
