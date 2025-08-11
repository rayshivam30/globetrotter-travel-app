import { NextResponse } from 'next/server';
import { searchCities } from '@/lib/services/location.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const results = await searchCities(query, limit);
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Error in location search:', error);
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    );
  }
}
