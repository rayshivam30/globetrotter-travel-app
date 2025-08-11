import { Pool } from "pg"

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
    const query = "SELECT * FROM activities WHERE city_id = $1 ORDER BY estimated_cost ASC"
    const result = await pool.query(query, [cityId])
    return result.rows
  },

  searchActivities: async (query: string, cityId?: number) => {
    let sql = "SELECT a.*, c.name as city_name FROM activities a JOIN cities c ON a.city_id = c.id WHERE a.name ILIKE $1 OR a.description ILIKE $1"
    const params: any[] = [`%${query}%`]

    if (cityId) {
      sql += " AND a.city_id = $2"
      params.push(cityId)
    }

    sql += " ORDER BY a.estimated_cost ASC LIMIT 50"

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
}
