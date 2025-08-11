"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plane, ArrowLeft, Search, MapPin } from "lucide-react"
import Link from "next/link"

import { useDebounce } from "@/hooks/use-debounce"

export default function CreateTripPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  })

  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectPlace = (place: string) => {
    setFormData(prev => ({ ...prev, place }))
    if (place && !selectedPlaces.includes(place)) {
      setSelectedPlaces(prev => [...prev, place])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a destination for your trip",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          start_date: formData.startDate,
          end_date: formData.endDate,
          location_id: selectedLocation.id,
          location_name: selectedLocation.name,
          country: selectedLocation.country,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Trip created!",
          description: "Your trip has been created successfully.",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create trip",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Trip</CardTitle>
            <CardDescription>Plan your next adventure with GlobeTrotter</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b text-sm font-medium text-gray-700 pb-2">Plan a new trip</div>
              <div className="space-y-2">
                <Label htmlFor="name">Trip Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., European Adventure 2024"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell us about your trip..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">

                  <Label htmlFor="place">Select a Place</Label>
                  <div className="relative">
                    <Input
                      id="place"
                      name="place"
                      placeholder="e.g., Paris, Bali, Tokyo"
                      value={formData.place}
                      onChange={handleChange}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>

                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>


              <div>
                <div className="border-b text-sm font-medium text-gray-700 pb-2">Suggestion for Places to Visit/Activities to perform</div>
                {selectedPlaces.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlaces.map((place, index) => (
                        <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{place}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedPlaces(prev => prev.filter((_, i) => i !== index))}
                            className="ml-1 text-blue-500 hover:text-blue-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <SuggestionsGrid 
                    query={formData.place} 
                    onSelect={handleSelectPlace} 
                    selectedPlaces={selectedPlaces}
                  />
                </div>
              </div>


              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Trip"}
                </Button>
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface LocationSuggestion {
  id: number
  name: string
  country: string
  lat: number
  lng: number
}

function SuggestionsGrid({
  query,
  onSelect,
  selectedPlaces = []
}: {
  query: string
  onSelect: (value: string) => void
  selectedPlaces?: string[]
}) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        setSuggestions([])
        return
      }
      
      setIsLoading(true)
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`/api/cities/search?q=${encodeURIComponent(debouncedQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch suggestions')
        
        const data = await response.json()
        setSuggestions(data.results || [])
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-3 h-16"></div>
        ))}
      </div>
    )
  }

  if (!query) {
    return null
  }

  if (suggestions.length === 0 && query) {
    return (
      <div className="text-sm text-gray-500 p-2">
        No locations found. Try a different search term.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {suggestions.map((location) => (
        <button
          key={location.id}
          type="button"
          onClick={() => onSelect(`${location.name}, ${location.country}`)}
          className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors flex items-start gap-2"
        >
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">{location.name}</div>
            <div className="text-sm text-gray-500">{location.country}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// useDebounce is imported from @/hooks/use-debounce
