"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BudgetCharts } from "./ui"

export default function TripBudgetPage() {
  const params = useParams()
  const tripId = Number(params.id)
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trip Budget</h1>
        <div className="flex gap-2">
          <Link href={`/trips/${tripId}/itinerary/view`}><Button variant="outline">Itinerary</Button></Link>
          <Link href={`/trips/${tripId}`}><Button variant="ghost">Trip</Button></Link>
        </div>
      </div>
      <BudgetCharts tripId={tripId} />
    </div>
  )
}
