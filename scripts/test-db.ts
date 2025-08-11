import { db } from '../lib/db';
import { cities } from '../lib/schema';

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by counting cities
    const result = await db.select({ count: sql<number>`count(*)` }).from(cities);
    console.log(`Successfully connected to database. Found ${result[0].count} cities.`);
    
    // Test search cities
    console.log('\nTesting city search...');
    const searchResults = await db
      .select()
      .from(cities)
      .where(ilike(cities.name, '%londo%'))
      .limit(3);
      
    console.log('Search results for "londo":', searchResults);
    
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDbConnection();
