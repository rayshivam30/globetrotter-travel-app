"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { estimateTripCost } from "@/lib/utils/budget"
import { Plane, ArrowLeft, Home, Utensils, Activity, Bus, IndianRupee } from "lucide-react"

interface City {
  id: number
  name: string
  country: string
  lat: number
  lng: number
}

interface Stop {
  city: City
  arrivalDate: string
  departureDate: string
  activities: Array<{
    estimated_cost: number
    duration_hours: number
  }>
}

export default function TripBudgetPage() {
  const params = useParams()
  const tripId = params?.id as string
  const router = useRouter()
  const [trip, setTrip] = useState<{
    origin: City | null
    stops: Stop[]
  } | null>(null)
  const [includeActivities, setIncludeActivities] = useState(true)
  const [estimate, setEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load trip data
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/auth/login")
          return
        }

        // Fetch trip details
        const [tripRes, stopsRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/trips/${tripId}/stops`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!tripRes.ok || !stopsRes.ok) {
          throw new Error("Failed to fetch trip data")
        }

        const tripData = await tripRes.json()
        const stopsData = await stopsRes.json()

        // Transform stops to include city coordinates
        const stopsWithCoords = await Promise.all(
          stopsData.stops.map(async (stop: any) => {
            // Fetch city details to get coordinates
            const cityRes = await fetch(
              `/api/cities/${stop.city_id}?fields=id,name,country,lat,lng`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            if (!cityRes.ok) throw new Error("Failed to fetch city details")
            const cityData = await cityRes.json()

            // Fetch activities for this stop
            const activitiesRes = await fetch(
              `/api/trips/stops/${stop.id}/activities`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            const activitiesData = activitiesRes.ok ? await activitiesRes.json() : []

            return {
              city: {
                id: stop.city_id,
                name: stop.city_name,
                country: stop.country,
                lat: parseFloat(cityData.lat) || 0,
                lng: parseFloat(cityData.lng) || 0,
              },
              arrivalDate: stop.arrival_date,
              departureDate: stop.departure_date,
              activities: activitiesData.activities || [],
            }
          })
        )

        // Get origin city details if available
        let originCity = null
        if (tripData.origin_city_id) {
          const originRes = await fetch(
            `/api/cities/${tripData.origin_city_id}?fields=id,name,country,lat,lng`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (originRes.ok) {
            const originData = await originRes.json()
            originCity = {
              id: originData.id,
              name: originData.name,
              country: originData.country,
              lat: parseFloat(originData.lat) || 0,
              lng: parseFloat(originData.lng) || 0,
            }
          }
        }

        setTrip({
          origin: originCity,
          stops: stopsWithCoords,
        })
      } catch (err) {
        console.error("Error loading trip data:", err)
        setError("Failed to load trip data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchTripData()
  }, [tripId, router])

  // Calculate estimate when trip data or includeActivities changes
  useEffect(() => {
    if (trip && trip.origin && trip.stops.length > 0) {
      const estimate = estimateTripCost(trip.origin, trip.stops, includeActivities)
      setEstimate(estimate)
    }
  }, [trip, includeActivities])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>No trip data available.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/trips/${tripId}`} className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Trip Budget Estimate</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/trips/${tripId}/itinerary/view`}>
            <Button variant="outline">View Itinerary</Button>
          </Link>
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost">Back to Trip</Button>
          </Link>
        </div>
      </div>

      {!trip.origin && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No origin city set. Budget estimates will be less accurate without a starting point.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Estimated Costs</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeActivities}
              onChange={(e) => setIncludeActivities(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Include Activities</span>
          </label>
        </div>
      </div>

      {estimate ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">Transport</CardTitle>
                  <Bus className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{estimate.transport.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">For all travel segments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">Accommodation</CardTitle>
                  <Home className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{estimate.accommodation.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">For all nights</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">Meals</CardTitle>
                  <Utensils className="h-5 w-5 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{estimate.meals.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">For all days</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-700">Total</CardTitle>
                  <IndianRupee className="h-5 w-5 text-blue-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">₹{estimate.total.toLocaleString()}</div>
                <p className="text-xs text-blue-600 mt-1">Estimated total cost</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Breakdown by Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From → To</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nights</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transport</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Accommodation</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Meals</th>
                      {includeActivities && (
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activities</th>
                      )}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {estimate.breakdown.map((segment: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {segment.from} → {segment.to}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {segment.distance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {segment.nights}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          ₹{segment.transportCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {segment.accommodationCost > 0 ? `₹${segment.accommodationCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {segment.mealsCost > 0 ? `₹${segment.mealsCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        {includeActivities && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {segment.activitiesCost > 0 ? `₹${segment.activitiesCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          ₹{segment.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={includeActivities ? 7 : 6} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total Estimated Cost
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-700">
                        ₹{estimate.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Not enough data to generate an estimate. Please add stops to your trip.</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        <h3 className="font-semibold mb-2">About these estimates:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Transport: ₹10 per km for ground transportation</li>
          <li>Accommodation: ₹1,000 per night (mid-range)</li>
          <li>Meals: ₹500 per meal (3 meals per day)</li>
          <li>Activities: Actual cost + 20% for unexpected expenses</li>
        </ul>
        <p className="mt-2 text-blue-700">These are estimates only. Actual costs may vary.</p>
      </div>
    </div>
  )
}
