"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plane, ArrowLeft, Calendar, DollarSign, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ItinerarySection {
  title: string
  description: string
  startDate: string
  endDate: string
  budget: string
}

export default function BuildItineraryPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params?.id as string

  const [sections, setSections] = useState<ItinerarySection[]>([
    { title: "Section 1", description: "", startDate: "", endDate: "", budget: "" },
    { title: "Section 2", description: "", startDate: "", endDate: "", budget: "" },
    { title: "Section 3", description: "", startDate: "", endDate: "", budget: "" },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/itinerary`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const loaded: ItinerarySection[] = (data.sections || []).map((s: any, i: number) => ({
            title: s.title || `Section ${i + 1}`,
            description: s.description || "",
            startDate: s.start_date || s.startDate || "",
            endDate: s.end_date || s.endDate || "",
            budget: s.budget?.toString?.() || "",
          }))
          if (loaded.length) setSections(loaded)
        }
      } catch (e) {
        console.error("Failed to load itinerary", e)
      } finally {
        setLoading(false)
      }
    })()
  }, [tripId])

  const updateSection = (index: number, partial: Partial<ItinerarySection>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...partial } : s)))
  }

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { title: `Section ${prev.length + 1}`, description: "", startDate: "", endDate: "", budget: "" },
    ])
  }

  const saveSections = async () => {
    try {
      setIsSaving(true)
      setSaveMessage(null)
      setSaveError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth/login")
        return
      }
      const payload = {
        sections: sections.map((s, idx) => ({
          title: s.title,
          description: s.description,
          startDate: s.startDate || null,
          endDate: s.endDate || null,
          budget: s.budget ? Number(s.budget) : null,
          order_index: idx,
        })),
      }
      const res = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let errText = "Save failed"
        try {
          const data = await res.json()
          if (data?.error) errText = data.error
        } catch {}
        setSaveError(errText)
        console.error("Save error:", res.status, errText)
        return
      }
      setSaveMessage("Itinerary saved successfully.")
    } catch (e: any) {
      console.error(e)
      setSaveError(e?.message || "Unexpected error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={`/trips/${tripId}`} className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <Plane className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">Build Itinerary</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/trips/${tripId}`)}>Back</Button>
            <Button onClick={saveSections} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
        {saveMessage && (
          <div className="mb-4 text-sm text-green-600">{saveMessage}</div>
        )}
        {saveError && (
          <div className="mb-4 text-sm text-red-600">{saveError}</div>
        )}

        {loading ? (
          <div className="text-center text-sm text-gray-500">Loading itinerary...</div>
        ) : (
        <div className="space-y-5">
          {sections.map((s, idx) => (
            <Card key={idx} className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 mb-3">
                  Travel section, hotel or any other activity
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`desc-${idx}`}>Details</Label>
                    <Textarea
                      id={`desc-${idx}`}
                      placeholder="Add notes for this section..."
                      value={s.description}
                      onChange={(e) => updateSection(idx, { description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <Label htmlFor={`start-${idx}`}>Start Date</Label>
                      <div className="relative">
                        <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id={`start-${idx}`}
                          type="date"
                          className="pl-9"
                          value={s.startDate}
                          onChange={(e) => updateSection(idx, { startDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`end-${idx}`}>End Date</Label>
                      <div className="relative">
                        <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id={`end-${idx}`}
                          type="date"
                          className="pl-9"
                          value={s.endDate}
                          onChange={(e) => updateSection(idx, { endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`budget-${idx}`}>Budget of this section</Label>
                      <div className="relative">
                        <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id={`budget-${idx}`}
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          className="pl-9"
                          value={s.budget}
                          onChange={(e) => updateSection(idx, { budget: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        <div className="mt-6">
          <Button variant="outline" onClick={addSection} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Add another Section
          </Button>
        </div>
      </div>
    </div>
  )
}
