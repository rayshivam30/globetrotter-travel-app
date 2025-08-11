"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plane, 
  Search, 
  Filter, 
  SortAsc,
  User,
  LogOut,
  Settings,
  X
} from "lucide-react"
import Link from "next/link"

interface Trip {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  stop_count: number
  total_budget: number
  cover_image?: string
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [sortBy, setSortBy] = useState<string>("date")
  const [groupBy, setGroupBy] = useState<string>("none")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }

    fetchUserData()
    fetchTrips()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/trips", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const tripsData = await response.json()
        setTrips(tripsData)
        setFilteredTrips(tripsData)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort trips
  useEffect(() => {
    try {
      console.log('Filtering trips:', { searchQuery, trips: trips.length, filterStatus, sortBy })
      let filtered = [...trips]

      // Search filter
      if (searchQuery && searchQuery.trim()) {
        console.log('Applying search filter for:', searchQuery)
        filtered = filtered.filter(trip => {
          try {
            const nameMatch = trip.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false
            const descMatch = trip.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false
            console.log(`Trip "${trip.name}": nameMatch=${nameMatch}, descMatch=${descMatch}`)
            return nameMatch || descMatch
          } catch (error) {
            console.error("Error filtering trip:", trip, error)
            return false
          }
        })
        console.log('After search filter:', filtered.length, 'trips')
      }

      // Status filter
      if (filterStatus !== "all") {
        const today = new Date()
        filtered = filtered.filter(trip => {
          try {
            const startDate = new Date(trip.start_date)
            const endDate = new Date(trip.end_date)
            
            switch (filterStatus) {
              case "upcoming":
                return startDate > today
              case "ongoing":
                return startDate <= today && endDate >= today
              case "completed":
                return endDate < today
              default:
                return true
            }
          } catch (error) {
            console.error("Error filtering trip by status:", trip, error)
            return false
          }
        })
      }

      // Sort trips
      try {
        filtered.sort((a, b) => {
          try {
            switch (sortBy) {
              case "date":
                return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
              case "name":
                return (a.name || "").localeCompare(b.name || "")
              case "budget":
                return (b.total_budget || 0) - (a.total_budget || 0)
              case "destinations":
                return (b.stop_count || 0) - (a.stop_count || 0)
              default:
                return 0
            }
          } catch (error) {
            console.error("Error sorting trips:", error)
            return 0
          }
        })
      } catch (error) {
        console.error("Error in sort operation:", error)
      }

      setFilteredTrips(filtered)
    } catch (error) {
      console.error("Error in filtering useEffect:", error)
      setFilteredTrips([])
    }
  }, [trips, searchQuery, sortBy, filterStatus])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getTripStatus = (startDate: string, endDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > today) return "upcoming"
    if (start <= today && end >= today) return "ongoing"
    return "completed"
  }

  const topRegionalSelections = [
    { name: "Europe", image: "/placeholder.svg?height=120&width=120", destinations: 15 },
    { name: "Asia", image: "/placeholder.svg?height=120&width=120", destinations: 12 },
    { name: "Americas", image: "/placeholder.svg?height=120&width=120", destinations: 8 },
    { name: "Africa", image: "/placeholder.svg?height=120&width=120", destinations: 6 },
    { name: "Oceania", image: "/placeholder.svg?height=120&width=120", destinations: 4 },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobalTrotter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back, {user?.first_name || "Traveler"}!</span>
              
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    {user?.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors cursor-pointer">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => {
                      localStorage.removeItem("token")
                      router.push("/auth/login")
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner Image */}
        <div className="mb-8">
          <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-2">Discover Your Next Adventure</h2>
              <p className="text-lg opacity-90">Plan, explore, and create unforgettable memories</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search destinations, activities, or trips..."
                value={searchQuery || ""}
                onChange={(e) => {
                  try {
                    setSearchQuery(e.target.value || "")
                  } catch (error) {
                    console.error("Error updating search query:", error)
                    setSearchQuery("")
                  }
                }}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setSearchQuery("")
                    } catch (error) {
                      console.error("Error clearing search query:", error)
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Group by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setGroupBy("none")}
                  className={groupBy === "none" ? "bg-blue-50" : ""}
                >
                  No grouping
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setGroupBy("status")}
                  className={groupBy === "status" ? "bg-blue-50" : ""}
                >
                  By Status
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setGroupBy("month")}
                  className={groupBy === "month" ? "bg-blue-50" : ""}
                >
                  By Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-blue-50" : ""}
                >
                  All Trips
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setFilterStatus("upcoming")}
                  className={filterStatus === "upcoming" ? "bg-blue-50" : ""}
                >
                  Upcoming
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setFilterStatus("ongoing")}
                  className={filterStatus === "ongoing" ? "bg-blue-50" : ""}
                >
                  Ongoing
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setFilterStatus("completed")}
                  className={filterStatus === "completed" ? "bg-blue-50" : ""}
                >
                  Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort by...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setSortBy("date")}
                  className={sortBy === "date" ? "bg-blue-50" : ""}
                >
                  Date (Newest)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("name")}
                  className={sortBy === "name" ? "bg-blue-50" : ""}
                >
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("budget")}
                  className={sortBy === "budget" ? "bg-blue-50" : ""}
                >
                  Budget (High-Low)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("destinations")}
                  className={sortBy === "destinations" ? "bg-blue-50" : ""}
                >
                  Destinations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Top Regional Selections */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Regional Selections</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topRegionalSelections.map((region) => (
              <Card key={region.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="w-full h-24 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{region.name}</h4>
                  <p className="text-xs text-gray-600">{region.destinations} destinations</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Previous Trips */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Previous Trips {filteredTrips.length !== trips.length && `(${filteredTrips.length} of ${trips.length})`}
            </h3>
            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Search className="h-4 w-4" />
                <span>Searching for: "{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {filteredTrips.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {searchQuery ? (
                  <>
                    <h4 className="text-lg font-semibold mb-2">No trips found</h4>
                    <p className="text-gray-600 mb-4">No trips match your search for "{searchQuery}"</p>
                    <Button onClick={() => setSearchQuery("")} variant="outline" className="mr-2">
                      Clear Search
                    </Button>
                    <Link href="/trips/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Plan a trip
                      </Button>
                    </Link>
                  </>
                ) : trips.length === 0 ? (
                  <>
                    <h4 className="text-lg font-semibold mb-2">No trips yet</h4>
                    <p className="text-gray-600 mb-4">Start planning your first adventure with GlobalTrotter</p>
                    <Link href="/trips/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Plan a trip
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <h4 className="text-lg font-semibold mb-2">No trips match filters</h4>
                    <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                    <Button onClick={() => {
                      setSearchQuery("")
                      setFilterStatus("all")
                      setSortBy("date")
                    }} variant="outline">
                      Clear All Filters
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
                      ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrips.slice(0, 3).map((trip) => (
                                  <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{trip.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{trip.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={
                              getTripStatus(trip.start_date, trip.end_date) === "upcoming" ? "default" :
                              getTripStatus(trip.start_date, trip.end_date) === "ongoing" ? "secondary" : "outline"
                            }
                            className={
                              getTripStatus(trip.start_date, trip.end_date) === "upcoming" ? "bg-green-100 text-green-800" :
                              getTripStatus(trip.start_date, trip.end_date) === "ongoing" ? "bg-blue-100 text-blue-800" : ""
                            }
                          >
                            {getTripStatus(trip.start_date, trip.end_date)}
                          </Badge>
                          <Badge variant="secondary">
                            {trip.stop_count} {trip.stop_count === 1 ? "stop" : "stops"}
                          </Badge>
                        </div>
                      </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${(trip.total_budget || 0).toLocaleString()}
                      </div>
                    </div>

                    <Link href={`/trips/${trip.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Link href="/trips/create">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
