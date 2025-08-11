// Simple seed script using Node.js native fetch and no TypeScript
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Client } = require('pg');
const { setTimeout } = require('timers/promises');

// Database connection configuration using DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Parse the database URL
const dbUrl = new URL(process.env.DATABASE_URL);
const dbConfig = {
  user: dbUrl.username,
  password: dbUrl.password,
  host: dbUrl.hostname,
  port: dbUrl.port || 5432,
  database: dbUrl.pathname.replace(/^\//, ''), // Remove leading slash
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// GeoDB API configuration
const GEO_API_KEY = process.env.NEXT_PUBLIC_GEODB_API_KEY;
if (!GEO_API_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_GEODB_API_KEY is not set in environment variables');
  process.exit(1);
}

const GEO_DB_API_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo';

// Helper function to make API requests with retries
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}...`);
      await setTimeout(1000 * (i + 1));
    }
  }
}

async function fetchCities(offset, limit = 10) {
  try {
    console.log(`🌍 Fetching cities ${offset + 1} to ${offset + limit}...`);
    
    const response = await fetchWithRetry(
      `${GEO_DB_API_URL}/cities?offset=${offset}&limit=${limit}&sort=-population&minPopulation=50000`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': GEO_API_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      }
    );

    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching cities:', error.message);
    return [];
  }
}

async function seedCities() {
  console.log('🚀 Starting to seed cities...');
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Run migrations
    console.log('🔄 Running migrations...');
    // Check if we need to add any columns
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cities'
    `);
    
    const columnNames = columns.map(c => c.column_name);
    const columnsToAdd = [];
    
    if (!columnNames.includes('country_code')) columnsToAdd.push('ADD COLUMN country_code VARCHAR(2)');
    if (!columnNames.includes('region')) columnsToAdd.push('ADD COLUMN region VARCHAR(100)');
    if (!columnNames.includes('latitude')) columnsToAdd.push('ADD COLUMN latitude DECIMAL(10, 8)');
    if (!columnNames.includes('longitude')) columnsToAdd.push('ADD COLUMN longitude DECIMAL(11, 8)');
    if (!columnNames.includes('population')) columnsToAdd.push('ADD COLUMN population INTEGER');
    if (!columnNames.includes('timezone')) columnsToAdd.push('ADD COLUMN timezone VARCHAR(50)');
    
    if (columnsToAdd.length > 0) {
      await client.query(`ALTER TABLE cities ${columnsToAdd.join(', ')}`);
      console.log('✅ Added missing columns to cities table');
    } else {
      console.log('✅ All required columns exist in cities table');
    }

    let offset = 0;
    const limit = 10;
    const maxIterations = 20; // Limit to 200 cities for initial testing
    let totalInserted = 0;
    let hasMore = true;

    while (hasMore && offset < maxIterations * limit) {
      const cities = await fetchCities(offset, limit);
      
      if (cities.length === 0) {
        console.log('No more cities to fetch.');
        hasMore = false;
        break;
      }

      console.log(`📥 Fetched ${cities.length} cities`);

      // Process each city in the batch
      for (const city of cities) {
        try {
          await client.query(
            `INSERT INTO cities (
              id, name, country, country_code, region, 
              latitude, longitude, population, timezone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              country = EXCLUDED.country,
              country_code = EXCLUDED.country_code,
              region = EXCLUDED.region,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              population = EXCLUDED.population,
              timezone = EXCLUDED.timezone
            `,
            [
              city.id.toString(),
              city.name,
              city.country,
              city.countryCode,
              city.region,
              city.latitude,
              city.longitude,
              city.population,
              city.timezone
            ]
          );
          
          totalInserted++;
          console.log(`✅ ${city.name}, ${city.country}`);
        } catch (error) {
          console.error(`❌ Error inserting ${city?.name || 'unknown city'}:`, error.message);
        }
      }

      offset += limit;
      
      // Add a small delay to avoid rate limiting
      if (hasMore) {
        console.log('⏳ Waiting 1 second before next batch...');
        await setTimeout(1000);
      }
    }

    // Create indexes after data is loaded
    console.log('🔨 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cities_country_code ON cities(country_code);
      CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);
      CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population);
      CREATE INDEX IF NOT EXISTS idx_cities_location ON cities(latitude, longitude);
    `);
    console.log('✅ Indexes created');

    console.log(`\n🎉 Seeding complete! Successfully processed ${totalInserted} cities.`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seed function
seedCities().catch(console.error);
