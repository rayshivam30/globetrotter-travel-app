"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Plane, ArrowLeft, Calendar, MapPin } from "lucide-react"
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

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }

    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/trips", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const tripsData = await response.json()
        setTrips(tripsData)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your trips...</p>
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
              <Link href="/dashboard" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
            <Link href="/trips/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Trip
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Trips</h2>
          <p className="text-gray-600">Manage and view all your travel plans</p>
        </div>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No trips yet</h4>
              <p className="text-gray-600 mb-4">Start planning your first adventure with GlobeTrotter</p>
              <Link href="/trips/create">
                <Button>Create Your First Trip</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{trip.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{trip.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {trip.stop_count} {trip.stop_count === 1 ? "stop" : "stops"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {trip.stop_count} destinations
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/trips/${trip.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
