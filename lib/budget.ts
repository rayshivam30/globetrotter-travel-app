import pool from "./database"
import { convertAmount } from "./exchange"

export type TravelStyle = "budget" | "midrange" | "luxury"

export type BudgetBreakdown = {
  transport: number
  accommodation: number
  activities: number
  meals: number
  miscellaneous: number
  currency: string
  total: number
}

async function getTripCore(tripId: number) {
  const res = await pool.query(`SELECT id, start_date, end_date, base_currency, origin_city_id FROM trips WHERE id = $1`, [tripId])
  return res.rows[0]
}

async function getTripStopsFull(tripId: number) {
  const res = await pool.query(
    `SELECT ts.*, c.name as city_name, c.country, c.id as city_id
     FROM trip_stops ts JOIN cities c ON c.id = ts.city_id
     WHERE ts.trip_id = $1 ORDER BY ts.order_index ASC`,
    [tripId]
  )
  return res.rows
}

async function getCityCost(cityId: number) {
  try {
    const r = await pool.query(
      `SELECT c.cost_index as city_ci,
              cc.avg_transport_cost, cc.avg_accommodation_per_night,
              cc.avg_meal_cost_budget, cc.avg_meal_cost_midrange, cc.avg_meal_cost_luxury,
              COALESCE(cc.currency, 'USD') as currency
       FROM cities c
       LEFT JOIN city_cost_index cc ON cc.city_id = c.id
       WHERE c.id = $1`,
      [cityId]
    )
    if (r.rows[0]) return r.rows[0]
  } catch (_) {
    // table may not exist yet; fall back to cities only
  }
  const f = await pool.query(`SELECT cost_index as city_ci FROM cities WHERE id = $1`, [cityId])
  return { city_ci: f.rows[0]?.city_ci ?? 100, currency: 'USD' }
}

async function getTripActivities(tripId: number) {
  const sql = `
    SELECT ta.id, ta.trip_stop_id, COALESCE(ta.actual_cost, a.estimated_cost) AS cost,
           a.currency AS activity_currency, a.category
    FROM trip_activities ta
    JOIN activities a ON a.id = ta.activity_id
    JOIN trip_stops ts ON ts.id = ta.trip_stop_id
    WHERE ts.trip_id = $1
  `
  const r = await pool.query(sql, [tripId])
  return r.rows
}

async function getTripCustomActivities(tripId: number) {
  const sql = `
    SELECT ai.id, ai.trip_stop_id, ai.custom_cost AS cost
    FROM activity_instances ai
    JOIN trip_stops ts ON ts.id = ai.trip_stop_id
    WHERE ts.trip_id = $1
  `
  const r = await pool.query(sql, [tripId])
  return r.rows
}

function nightsBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  const sMs = s.getTime()
  const eMs = e.getTime()
  if (!isFinite(sMs) || !isFinite(eMs)) return 1
  const ms = eMs - sMs
  const days = ms / (1000 * 60 * 60 * 24)
  return Math.max(1, Math.round(days))
}

export async function estimateBudget(
  tripId: number,
  opts: { travelStyle?: TravelStyle; miscPercent?: number; targetCurrency?: string } = {}
): Promise<BudgetBreakdown> {
  const travelStyle = opts.travelStyle || "midrange"
  const trip = await getTripCore(tripId)
  if (!trip) throw new Error("Trip not found")
  const baseCurrency: string = trip.base_currency || opts.targetCurrency || "USD"
  const targetCurrency = (opts.targetCurrency || baseCurrency).toUpperCase()

  const stops = await getTripStopsFull(tripId)
  let transport = 0
  let accommodation = 0
  let meals = 0

  // Include origin -> first stop leg
  if (trip.origin_city_id && stops[0]) {
    const originCost = await getCityCost(trip.origin_city_id)
    const ci = Number(originCost?.city_ci || 100)
    const originLeg = Math.max(30, ci * 0.4)
    transport += originLeg
  }

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    const cc = await getCityCost(stop.city_id)
    const ci = Number(cc?.city_ci || 100) // generic city cost index baseline

    // Transport fallback: proportional to city index
    const transportAvg = Number(cc?.avg_transport_cost)
    const transportFallback = Math.max(20, ci * 0.2)
    transport += isFinite(transportAvg) && transportAvg > 0 ? transportAvg : transportFallback

    // Accommodation and meals by nights
    const nights = nightsBetween(stop.arrival_date, stop.departure_date)

    const hotelNightAvg = Number(cc?.avg_accommodation_per_night)
    const hotelNightFallback = Math.max(25, ci * 0.5)
    const hotelNight = isFinite(hotelNightAvg) && hotelNightAvg > 0 ? hotelNightAvg : hotelNightFallback
    accommodation += hotelNight * nights

    const mealBudgetAvg = Number(cc?.avg_meal_cost_budget)
    const mealMidAvg = Number(cc?.avg_meal_cost_midrange)
    const mealLuxAvg = Number(cc?.avg_meal_cost_luxury)

    const mealFallbackBase = {
      budget: Math.max(10, ci * 0.2),
      midrange: Math.max(15, ci * 0.35),
      luxury: Math.max(25, ci * 0.6),
    } as const

    const mealDaily = travelStyle === "budget"
      ? (isFinite(mealBudgetAvg) && mealBudgetAvg > 0 ? mealBudgetAvg : mealFallbackBase.budget)
      : travelStyle === "luxury"
      ? (isFinite(mealLuxAvg) && mealLuxAvg > 0 ? mealLuxAvg : mealFallbackBase.luxury)
      : (isFinite(mealMidAvg) && mealMidAvg > 0 ? mealMidAvg : mealFallbackBase.midrange)

    meals += mealDaily * Math.max(1, nights)
  }

  // Activities (catalog-based)
  const activitiesRows = await getTripActivities(tripId)
  let activities = 0
  for (const row of activitiesRows) {
    const amount = Number(row.cost || 0)
    const curr = (row.activity_currency || baseCurrency).toUpperCase()
    if (curr !== targetCurrency) {
      activities += await convertAmount(amount, curr, targetCurrency)
    } else {
      activities += amount
    }
  }

  // Custom activity instances (assumed in trip base currency)
  const customRows = await getTripCustomActivities(tripId)
  for (const row of customRows) {
    const amount = Number(row.cost || 0)
    if (targetCurrency !== baseCurrency) {
      activities += await convertAmount(amount, baseCurrency, targetCurrency)
    } else {
      activities += amount
    }
  }

  // Convert base buckets to target currency if needed
  if (targetCurrency !== baseCurrency) {
    transport = await convertAmount(transport, baseCurrency, targetCurrency)
    accommodation = await convertAmount(accommodation, baseCurrency, targetCurrency)
    meals = await convertAmount(meals, baseCurrency, targetCurrency)
  }

  const preMiscTotal = transport + accommodation + activities + meals
  const miscPercent = typeof opts.miscPercent === 'number' ? opts.miscPercent : 10
  const miscellaneous = Number(((preMiscTotal * miscPercent) / 100).toFixed(2))
  const total = Number((preMiscTotal + miscellaneous).toFixed(2))

  return {
    transport: Number(transport.toFixed(2)),
    accommodation: Number(accommodation.toFixed(2)),
    activities: Number(activities.toFixed(2)),
    meals: Number(meals.toFixed(2)),
    miscellaneous,
    currency: targetCurrency,
    total,
  }
} 