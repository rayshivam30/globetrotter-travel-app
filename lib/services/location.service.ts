import { db } from '@/lib/db';
import { cities, type City } from '@/lib/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

export async function searchCities(query: string, limit = 10): Promise<City[]> {
  if (!query?.trim()) {
    return [];
  }

  try {
    const searchTerm = `%${query}%`;
    
    return await db
      .select()
      .from(cities)
      .where(
        or(
          ilike(cities.name, searchTerm),
          ilike(cities.country, searchTerm),
          ilike(cities.region, searchTerm)
        )
      )
      .orderBy(desc(cities.population))
      .limit(limit);
  } catch (error) {
    console.error('Error searching cities:', error);
    throw new Error('Failed to search for cities');
  }
}

export async function getCityById(id: number): Promise<City | null> {
  try {
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, id));
    
    return city || null;
  } catch (error) {
    console.error(`Error fetching city with ID ${id}:`, error);
    throw new Error('Failed to fetch city');
  }
}

export async function getPopularCities(limit = 10): Promise<City[]> {
  try {
    return await db
      .select()
      .from(cities)
      .orderBy(desc(cities.population))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching popular cities:', error);
    throw new Error('Failed to fetch popular cities');
  }
}

export async function getCitiesByCountry(countryCode: string): Promise<City[]> {
  try {
    return await db
      .select()
      .from(cities)
      .where(eq(cities.countryCode, countryCode))
      .orderBy(desc(cities.population));
  } catch (error) {
    console.error(`Error fetching cities for country ${countryCode}:`, error);
    throw new Error('Failed to fetch cities by country');
  }
}

// Get nearby cities based on coordinates and radius (in km)
export async function getNearbyCities(
  latitude: number,
  longitude: number,
  radiusKm = 50,
  limit = 10
): Promise<City[]> {
  try {
    // Earth's radius in km
    const earthRadiusKm = 6371;
    
    return await db
      .select()
      .from(cities)
      .where(
        sql`(
          ${earthRadiusKm} * acos(
            cos(radians(${latitude})) * 
            cos(radians(${cities.latitude})) * 
            cos(radians(${cities.longitude}) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(${cities.latitude}))
          )
        ) <= ${radiusKm}`
      )
      .orderBy(
        sql`${earthRadiusKm} * acos(
          cos(radians(${latitude})) * 
          cos(radians(${cities.latitude})) * 
          cos(radians(${cities.longitude}) - radians(${longitude})) + 
          sin(radians(${latitude})) * 
          sin(radians(${cities.latitude}))
        )`
      )
      .limit(limit);
  } catch (error) {
    console.error('Error fetching nearby cities:', error);
    throw new Error('Failed to fetch nearby cities');
  }
}
