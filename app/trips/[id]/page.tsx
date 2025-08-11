"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plane, ArrowLeft, Calendar, MapPin, DollarSign } from "lucide-react"
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

export default function TripDetailPage() {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const tripId = params.id

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }

    fetchTrip()
  }, [tripId])

  const fetchTrip = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const tripData = await response.json()
        setTrip(tripData)
      } else {
        router.push("/trips")
      }
    } catch (error) {
      console.error("Error fetching trip:", error)
      router.push("/trips")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
          <Link href="/trips">
            <Button>Back to Trips</Button>
          </Link>
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
              <Link href="/trips" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
            <Badge variant="secondary">
              {trip.stop_count} {trip.stop_count === 1 ? "stop" : "stops"}
            </Badge>
          </div>
          <p className="text-gray-600 text-lg">{trip.description}</p>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Duration</h3>
              <p className="text-sm text-gray-600">
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Destinations</h3>
              <p className="text-2xl font-bold text-green-600">{trip.stop_count}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Total Budget</h3>
              <p className="text-2xl font-bold text-orange-600">
                ${(trip.total_budget || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trip Stops */}
        <Card>
          <CardHeader>
            <CardTitle>Itinerary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No stops planned yet</h4>
              <p className="text-gray-600 mb-4">Add destinations to your trip to see your itinerary</p>
              <Button>Add Destination</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
