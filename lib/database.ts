import { Pool, PoolClient } from "pg"

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database")
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
  process.exit(-1)
})

export default pool

// Database helper functions
export const dbHelpers = {
  // User operations
  createUser: async (userData: {
    email: string
    password_hash: string
    first_name?: string
    last_name?: string
    phone_number?: string
    city?: string
    country?: string
    profile_image?: string
  }) => {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, city, country, profile_image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `
    const values = [
      userData.email,
      userData.password_hash,
      userData.first_name || null,
      userData.last_name || null,
      userData.phone_number || null,
      userData.city || null,
      userData.country || null,
      userData.profile_image || null,
    ]
    const result = await pool.query(query, values)
    return { lastInsertRowid: result.rows[0].id }
  },

  updateUser: async (id: number, data: {
    first_name?: string | null
    last_name?: string | null
    phone_number?: string | null
    city?: string | null
    country?: string | null
    profile_image?: string | null
  }) => {
    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, phone_number = $3, city = $4, country = $5, profile_image = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id
    `
    const values = [
      data.first_name ?? null,
      data.last_name ?? null,
      data.phone_number ?? null,
      data.city ?? null,
      data.country ?? null,
      data.profile_image ?? null,
      id,
    ]
    const result = await pool.query(query, values)
    return { lastInsertRowid: result.rows[0]?.id }
  },

  deleteUser: async (id: number) => {
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    return { success: true }
  },

  setTripPublic: async (tripId: number, isPublic: boolean) => {
    const query = `UPDATE trips SET is_public = $1, updated_at = NOW() WHERE id = $2 RETURNING is_public`
    const result = await pool.query(query, [isPublic, tripId])
    return { is_public: result.rows[0]?.is_public }
  },

  updateTripActivity: async (id: number, tripStopId: number, data: {
    scheduled_date?: string | null
    scheduled_time?: string | null
    notes?: string | null
    actual_cost?: number | null
  }) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const query = `
        UPDATE trip_activities
        SET scheduled_date = $1, scheduled_time = $2, notes = $3, actual_cost = $4
        WHERE id = $5 AND trip_stop_id = $6
        RETURNING id
      `
      const values = [
        data.scheduled_date ?? null,
        data.scheduled_time ?? null,
        data.notes ?? null,
        data.actual_cost ?? null,
        id,
        tripStopId,
      ]
      const result = await client.query(query, values)
      // find trip id for this stop and recalc total budget
      const tRes = await client.query('SELECT trip_id FROM trip_stops WHERE id = $1', [tripStopId])
      const tripId = tRes.rows[0]?.trip_id
      if (tripId) {
        await dbHelpers.recalcTripTotalBudget(tripId, client)
      }
      await client.query('COMMIT')
      return { lastInsertRowid: result.rows[0]?.id }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },

  getUserByEmail: async (email: string) => {
    const query = "SELECT * FROM users WHERE email = $1"
    const result = await pool.query(query, [email])
    return result.rows[0]
  },

  getUserById: async (id: number) => {
    const query = "SELECT * FROM users WHERE id = $1"
    const result = await pool.query(query, [id])
    return result.rows[0]
  },

  // Trip operations
  createTrip: async (tripData: {
    user_id: number
    name: string
    description?: string
    start_date: string
    end_date: string
    cover_image?: string
  }) => {
    const query = `
      INSERT INTO trips (user_id, name, description, start_date, end_date, cover_image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `
    const values = [
      tripData.user_id,
      tripData.name,
      tripData.description || null,
      tripData.start_date,
      tripData.end_date,
      tripData.cover_image || null,
    ]
    const result = await pool.query(query, values)
    return { lastInsertRowid: result.rows[0].id }
  },

  getTripsByUserId: async (userId: number) => {
    const query = `
      SELECT t.*, 
             COUNT(ts.id) as stop_count,
             MIN(ts.arrival_date) as first_stop_date
      FROM trips t
      LEFT JOIN trip_stops ts ON t.id = ts.trip_id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `
    const result = await pool.query(query, [userId])
    return result.rows
  },

  getTripById: async (id: number) => {
    const query = "SELECT * FROM trips WHERE id = $1"
    const result = await pool.query(query, [id])
    return result.rows[0]
  },

  // City operations
  searchCities: async (query: string) => {
    const sql = `
      SELECT * FROM cities 
      WHERE name ILIKE $1 OR country ILIKE $1
      ORDER BY popularity_score DESC
      LIMIT 20
    `
    const result = await pool.query(sql, [`%${query}%`])
    return result.rows
  },

  getAllCities: async () => {
    const query = "SELECT * FROM cities ORDER BY popularity_score DESC"
    const result = await pool.query(query)
    return result.rows
  },

  // Activity operations
  getActivitiesByCity: async (cityId: number) => {
    const query = `
      SELECT DISTINCT ON (a.name)
        a.*
      FROM activities a
      WHERE a.city_id = $1
      ORDER BY a.name, a.estimated_cost ASC, a.id ASC
    `
    const result = await pool.query(query, [cityId])
    return result.rows
  },

  searchActivities: async (query: string, cityId?: number) => {
    let sql = `
      SELECT DISTINCT ON (a.city_id, a.name)
        a.*, c.name as city_name
      FROM activities a 
      JOIN cities c ON a.city_id = c.id 
      WHERE (a.name ILIKE $1 OR a.description ILIKE $1)
    `
    const params: any[] = [`%${query}%`]

    if (cityId) {
      sql += " AND a.city_id = $2"
      params.push(cityId)
    }

    sql += " ORDER BY a.city_id, a.name, a.estimated_cost ASC, a.id ASC LIMIT 50"

    const result = await pool.query(sql, params)
    return result.rows
  },

  // Trip stops operations
  addTripStop: async (stopData: {
    trip_id: number
    city_id: number
    arrival_date: string
    departure_date: string
    order_index: number
  }) => {
    const query = `
      INSERT INTO trip_stops (trip_id, city_id, arrival_date, departure_date, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `
    const values = [
      stopData.trip_id,
      stopData.city_id,
      stopData.arrival_date,
      stopData.departure_date,
      stopData.order_index,
    ]
    const result = await pool.query(query, values)
    return { lastInsertRowid: result.rows[0].id }
  },

  getTripStops: async (tripId: number) => {
    const query = `
      SELECT ts.*, c.name as city_name, c.country, c.cost_index
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.trip_id = $1
      ORDER BY ts.order_index ASC
    `
    const result = await pool.query(query, [tripId])
    return result.rows
  },

  replaceTripStops: async (
    tripId: number,
    stops: { city_id: number; arrival_date: string; departure_date: string; order_index: number }[],
  ) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM trip_stops WHERE trip_id = $1', [tripId])
      const insertSql = `
        INSERT INTO trip_stops (trip_id, city_id, arrival_date, departure_date, order_index)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `
      const ids: number[] = []
      for (const s of stops) {
        const res = await client.query(insertSql, [tripId, s.city_id, s.arrival_date, s.departure_date, s.order_index])
        ids.push(res.rows[0].id)
      }
      await client.query('COMMIT')
      return { stopIds: ids }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Trip activities per stop
  getTripActivitiesByStop: async (tripStopId: number) => {
    const query = `
      SELECT ta.*, a.name, a.estimated_cost, a.duration_hours, a.category
      FROM trip_activities ta
      JOIN activities a ON a.id = ta.activity_id
      WHERE ta.trip_stop_id = $1
      ORDER BY ta.scheduled_date, ta.scheduled_time
    `
    const result = await pool.query(query, [tripStopId])
    return result.rows
  },

  addTripActivity: async (data: {
    trip_stop_id: number
    activity_id: number
    scheduled_date?: string | null
    scheduled_time?: string | null
    notes?: string | null
    actual_cost?: number | null
  }) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const query = `
        INSERT INTO trip_activities (trip_stop_id, activity_id, scheduled_date, scheduled_time, notes, actual_cost)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `
      const values = [
        data.trip_stop_id,
        data.activity_id,
        data.scheduled_date || null,
        data.scheduled_time || null,
        data.notes || null,
        data.actual_cost ?? null,
      ]
      const result = await client.query(query, values)
      const tRes = await client.query('SELECT trip_id FROM trip_stops WHERE id = $1', [data.trip_stop_id])
      const tripId = tRes.rows[0]?.trip_id
      if (tripId) {
        await dbHelpers.recalcTripTotalBudget(tripId, client)
      }
      await client.query('COMMIT')
      return { lastInsertRowid: result.rows[0].id }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },

  deleteTripActivity: async (id: number) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // find trip id via stop first
      const pre = await client.query('SELECT trip_stop_id FROM trip_activities WHERE id = $1', [id])
      await client.query('DELETE FROM trip_activities WHERE id = $1', [id])
      const stopId = pre.rows[0]?.trip_stop_id
      if (stopId) {
        const tRes = await client.query('SELECT trip_id FROM trip_stops WHERE id = $1', [stopId])
        const tripId = tRes.rows[0]?.trip_id
        if (tripId) {
          await dbHelpers.recalcTripTotalBudget(tripId, client)
        }
      }
      await client.query('COMMIT')
      return { success: true }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },

  // helper to recompute budgets: per-category and total
  recalcTripTotalBudget: async (tripId: number, clientArg?: Pool | PoolClient) => {
    const client: Pool | PoolClient = clientArg || pool
    const actsSql = `
      SELECT COALESCE(SUM(COALESCE(ta.actual_cost, a.estimated_cost)), 0) AS activities_total
      FROM trip_activities ta
      JOIN activities a ON a.id = ta.activity_id
      JOIN trip_stops ts ON ts.id = ta.trip_stop_id
      WHERE ts.trip_id = $1
    `
    const stopsSql = `
      SELECT 
        COALESCE(SUM(transport_budget), 0) AS transport_total,
        COALESCE(SUM(accommodation_budget), 0) AS hotel_total,
        COALESCE(SUM(meals_budget), 0) AS meals_total
      FROM trip_stops
      WHERE trip_id = $1
    `
    const sectionsSql = `
      SELECT COALESCE(SUM(budget), 0) AS sections_total
      FROM itinerary_sections
      WHERE trip_id = $1
    `
    const [actsRes, stopsRes, secRes] = await Promise.all([
      (client as any).query(actsSql, [tripId]),
      (client as any).query(stopsSql, [tripId]),
      (client as any).query(sectionsSql, [tripId]),
    ])
    const activities_total = Number(actsRes.rows[0]?.activities_total ?? 0)
    const transport_total = Number(stopsRes.rows[0]?.transport_total ?? 0)
    const hotel_total = Number(stopsRes.rows[0]?.hotel_total ?? 0)
    const meals_total = Number(stopsRes.rows[0]?.meals_total ?? 0)
    const sections_total = Number(secRes.rows[0]?.sections_total ?? 0)
    const computed_total = transport_total + hotel_total + meals_total + activities_total
    const total_budget = sections_total > 0 ? sections_total : computed_total
    await (client as any).query(
      `UPDATE trips 
         SET total_budget = $1,
             transport_budget_total = $2,
             hotel_budget_total = $3,
             meals_budget_total = $4,
             activities_budget_total = $5,
             updated_at = NOW()
       WHERE id = $6`,
      [total_budget, transport_total, hotel_total, meals_total, activities_total, tripId],
    )
    return {
      total: total_budget,
      from: sections_total > 0 ? 'sections' : 'categories',
      breakdown: { transport_total, hotel_total, meals_total, activities_total },
    }
  },

  getTripActivitiesByTrip: async (tripId: number) => {
    const query = `
      SELECT ta.*, a.name, a.estimated_cost, a.duration_hours, a.category, ts.id as trip_stop_id
      FROM trip_activities ta
      JOIN activities a ON a.id = ta.activity_id
      JOIN trip_stops ts ON ts.id = ta.trip_stop_id
      WHERE ts.trip_id = $1
      ORDER BY ta.scheduled_date, ta.scheduled_time
    `
    const result = await pool.query(query, [tripId])
    return result.rows
  },

  // --- Admin helpers ---
  setUserAdminByEmail: async (email: string, isAdmin: boolean) => {
    const res = await pool.query('UPDATE users SET is_admin = $1, updated_at = NOW() WHERE email = $2 RETURNING id, is_admin', [isAdmin, email])
    return res.rows[0]
  },

  getAdminMetrics: async () => {
    const totalUsersQ = 'SELECT COUNT(*)::int AS total_users FROM users'
    const totalTripsQ = 'SELECT COUNT(*)::int AS total_trips FROM trips'
    const tripsByDayQ = `
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM trips
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1
    `
    const topCitiesQ = `
      SELECT c.name, c.country, COUNT(*)::int AS uses
      FROM trip_stops ts JOIN cities c ON c.id = ts.city_id
      GROUP BY c.id
      ORDER BY uses DESC
      LIMIT 10
    `
    const topActivitiesQ = `
      SELECT a.name, COUNT(*)::int AS uses
      FROM trip_activities ta JOIN activities a ON a.id = ta.activity_id
      GROUP BY a.id
      ORDER BY uses DESC
      LIMIT 10
    `
    const activeUsersQ = `
      SELECT COUNT(DISTINCT t.user_id)::int AS active_users
      FROM trips t
      WHERE t.created_at >= NOW() - INTERVAL '30 days'
    `
    const [u, tr, byDay, cities, acts, active] = await Promise.all([
      pool.query(totalUsersQ),
      pool.query(totalTripsQ),
      pool.query(tripsByDayQ),
      pool.query(topCitiesQ),
      pool.query(topActivitiesQ),
      pool.query(activeUsersQ),
    ])
    return {
      total_users: u.rows[0]?.total_users ?? 0,
      total_trips: tr.rows[0]?.total_trips ?? 0,
      trips_by_day: byDay.rows,
      top_cities: cities.rows,
      top_activities: acts.rows,
      active_users_last_30_days: active.rows[0]?.active_users ?? 0,
    }
  },

  getAdminUsers: async (limit = 20, offset = 0) => {
    const sql = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, u.is_admin,
             COALESCE(t.cnt, 0)::int AS trip_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS cnt FROM trips GROUP BY user_id
      ) t ON t.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `
    const res = await pool.query(sql, [limit, offset])
    return res.rows
  },

  getAdminTrips: async (limit = 20, offset = 0) => {
    const sql = `
      SELECT t.id, t.name, t.created_at, t.total_budget, t.is_public,
             u.email AS owner_email,
             COALESCE(s.cnt, 0)::int AS stop_count
      FROM trips t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) AS cnt FROM trip_stops GROUP BY trip_id
      ) s ON s.trip_id = t.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `
    const res = await pool.query(sql, [limit, offset])
    return res.rows
  },

  // Itinerary sections operations
  getItinerarySections: async (tripId: number) => {
    const query = `
      SELECT id, trip_id, title, description, start_date, end_date, budget, order_index
      FROM itinerary_sections
      WHERE trip_id = $1
      ORDER BY order_index ASC
    `
    const result = await pool.query(query, [tripId])
    return result.rows
  },

  replaceItinerarySections: async (
    tripId: number,
    sections: {
      title: string
      description?: string
      start_date?: string | null
      end_date?: string | null
      budget?: number | null
      order_index: number
    }[],
  ) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM itinerary_sections WHERE trip_id = $1', [tripId])

      const insertSql = `
        INSERT INTO itinerary_sections (trip_id, title, description, start_date, end_date, budget, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `

      for (const s of sections) {
        const values = [
          tripId,
          s.title,
          s.description || null,
          s.start_date || null,
          s.end_date || null,
          s.budget ?? null,
          s.order_index,
        ]
        await client.query(insertSql, values)
      }

      // Recompute total budget from itinerary sections and update the trip
      const sumRes = await client.query(
        'SELECT COALESCE(SUM(budget), 0) AS total FROM itinerary_sections WHERE trip_id = $1',
        [tripId]
      )
      const total = sumRes.rows[0]?.total ?? 0
      await client.query('UPDATE trips SET total_budget = $1, updated_at = NOW() WHERE id = $2', [total, tripId])

      await client.query('COMMIT')
      return { success: true }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Custom activities
  addCustomActivityInstance: async (data: { trip_stop_id: number; name: string; custom_cost?: number | null; notes?: string | null }) => {
    const sql = `INSERT INTO activity_instances (trip_stop_id, name, custom_cost, notes) VALUES ($1,$2,$3,$4) RETURNING id`
    const res = await pool.query(sql, [data.trip_stop_id, data.name, data.custom_cost ?? null, data.notes ?? null])
    return { id: res.rows[0]?.id }
  },

  upsertCityCostIndex: async (row: {
    city_id: number
    avg_transport_cost?: number | null
    avg_accommodation_per_night?: number | null
    avg_meal_cost_budget?: number | null
    avg_meal_cost_midrange?: number | null
    avg_meal_cost_luxury?: number | null
    currency?: string | null
  }) => {
    const sql = `INSERT INTO city_cost_index (city_id, avg_transport_cost, avg_accommodation_per_night, avg_meal_cost_budget, avg_meal_cost_midrange, avg_meal_cost_luxury, currency)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 ON CONFLICT (city_id) DO UPDATE SET
                   avg_transport_cost = EXCLUDED.avg_transport_cost,
                   avg_accommodation_per_night = EXCLUDED.avg_accommodation_per_night,
                   avg_meal_cost_budget = EXCLUDED.avg_meal_cost_budget,
                   avg_meal_cost_midrange = EXCLUDED.avg_meal_cost_midrange,
                   avg_meal_cost_luxury = EXCLUDED.avg_meal_cost_luxury,
                   currency = EXCLUDED.currency`
    await pool.query(sql, [
      row.city_id,
      row.avg_transport_cost ?? null,
      row.avg_accommodation_per_night ?? null,
      row.avg_meal_cost_budget ?? null,
      row.avg_meal_cost_midrange ?? null,
      row.avg_meal_cost_luxury ?? null,
      (row.currency || 'USD').toUpperCase(),
    ])
    return { success: true }
  },
}
