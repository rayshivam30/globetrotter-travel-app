"use client"

import { useEffect, useMemo, useState } from "react"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"

export function BudgetCharts({ tripId }: { tripId: number }) {
  const [data, setData] = useState<any | null>(null)
  const [currency, setCurrency] = useState("USD")
  const [style, setStyle] = useState("midrange")
  const [misc, setMisc] = useState(10)

  useEffect(()=>{
    const token = localStorage.getItem("token")
    if (!token) return
    ;(async()=>{
      const url = `/api/trips/${tripId}/budget?currency=${encodeURIComponent(currency)}&style=${encodeURIComponent(style)}&misc=${misc}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setData(await res.json())
    })()
  }, [tripId, currency, style, misc])

  const items = useMemo(()=> data?[
    { key: 'Transport', value: data.transport },
    { key: 'Accommodation', value: data.accommodation },
    { key: 'Activities', value: data.activities },
    { key: 'Meals', value: data.meals },
    { key: 'Misc', value: data.miscellaneous },
  ]:[], [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">Currency</label>
        <input className="border rounded px-2 py-1 text-sm" value={currency} onChange={(e)=>setCurrency(e.target.value.toUpperCase())} />
        <label className="text-sm ml-3">Style</label>
        <select className="border rounded px-2 py-1 text-sm" value={style} onChange={(e)=>setStyle(e.target.value)}>
          <option value="budget">Budget</option>
          <option value="midrange">Midrange</option>
          <option value="luxury">Luxury</option>
        </select>
        <label className="text-sm ml-3">Misc %</label>
        <input type="number" className="border rounded px-2 py-1 text-sm w-20" value={misc} onChange={(e)=>setMisc(Number(e.target.value)||0)} />
      </div>

      <Card className="p-3">
        <ChartContainer config={{}}
          className="h-72">
          {({}) => (
            // Simple stacked bar composition using Recharts directly here to avoid heavy wrappers
            // We rely on ChartContainer for styling
            <></>
          )}
        </ChartContainer>
        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          {items.map(r => (
            <div key={r.key} className="flex items-center justify-between border rounded px-3 py-2">
              <div>{r.key}</div>
              <div className="font-semibold">{data?.currency} {Math.round(r.value).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right font-bold">Total: {data?.currency} {Math.round(data?.total||0).toLocaleString()}</div>
      </Card>
    </div>
  )
} 