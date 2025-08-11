"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plane, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateTripPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    place: "",
    endDate: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
                  <Input
                    id="place"
                    name="place"
                    placeholder="e.g., Paris, Bali, Tokyo"
                    value={formData.place}
                    onChange={handleChange}
                  />
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
                <SuggestionsGrid query={formData.place} onSelect={(v) => setFormData((p) => ({ ...p, place: v }))} />
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

function SuggestionsGrid({
  query,
  onSelect,
}: {
  query: string
  onSelect: (value: string) => void
}) {
  const items = allSuggestions
    .filter((s) =>
      query ? (s.keywords.join(" ") + " " + s.title + " " + (s.location || "")).toLowerCase().includes(query.toLowerCase()) : true
    )
    .slice(0, 6)

  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((s) => (
        <Card key={s.title} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => onSelect(s.title)}>
          <CardContent className="p-4">
            <div className="h-24 rounded-md bg-gray-200 mb-3" />
            <div className="font-medium text-sm">{s.title}</div>
            {s.location && <div className="text-xs text-gray-600">{s.location}</div>}
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="col-span-2 md:col-span-3 text-sm text-gray-500">No suggestions. Try another place.</div>
      )}
    </div>
  )
}

const allSuggestions: { title: string; location?: string; keywords: string[] }[] = [
  { title: "Eiffel Tower", location: "Paris, France", keywords: ["paris", "europe", "france", "tower", "landmark"] },
  { title: "Colosseum", location: "Rome, Italy", keywords: ["rome", "italy", "europe", "history"] },
  { title: "Sagrada Família", location: "Barcelona, Spain", keywords: ["barcelona", "spain", "gaudi", "europe"] },
  { title: "Mount Fuji", location: "Japan", keywords: ["tokyo", "japan", "asia", "fuji", "mountain"] },
  { title: "Ubud Rice Terraces", location: "Bali, Indonesia", keywords: ["bali", "indonesia", "asia", "rice", "ubud"] },
  { title: "Grand Canyon", location: "Arizona, USA", keywords: ["usa", "america", "canyon", "hike"] },
  { title: "Christ the Redeemer", location: "Rio de Janeiro, Brazil", keywords: ["rio", "brazil", "christ", "redeemer"] },
  { title: "Machu Picchu", location: "Peru", keywords: ["peru", "inca", "trek", "south america"] },
  { title: "Table Mountain", location: "Cape Town, South Africa", keywords: ["africa", "cape town", "hike", "views"] },
  { title: "Marrakesh Souks", location: "Morocco", keywords: ["africa", "morocco", "markets", "marrakesh"] },
  { title: "Sydney Opera House", location: "Sydney, Australia", keywords: ["oceania", "australia", "sydney", "opera"] },
  { title: "Waitomo Glowworm Caves", location: "New Zealand", keywords: ["oceania", "new zealand", "caves", "glowworm"] },
]
