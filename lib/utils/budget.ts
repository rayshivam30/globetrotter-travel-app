/**
 * Simple budget estimation utilities
 */

// Base costs in INR (Indian Rupees)
const TRANSPORT_COST_PER_KM = 10; // ₹10 per km (average cost for ground transport)
const ACCOMMODATION_COST_PER_NIGHT = 1000; // ₹1000 per night (average mid-range)
const MEAL_COST = 500; // ₹500 per meal
const ACTIVITY_COST_MULTIPLIER = 1.2; // 20% markup on activity costs

interface Stop {
  city: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  arrivalDate: string;
  departureDate: string;
  activities: Array<{
    estimated_cost: number;
    duration_hours: number;
  }>;
}

interface TripEstimate {
  transport: number;
  accommodation: number;
  meals: number;
  activities: number;
  total: number;
  breakdown: Array<{
    from: string;
    to: string;
    distance: number;
    transportCost: number;
    nights: number;
    accommodationCost: number;
    mealsCost: number;
    activitiesCost: number;
    subtotal: number;
  }>;
}

// Calculate distance between two points in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate number of nights between two dates
function calculateNights(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function estimateTripCost(
  origin: { id: number; name: string; lat: number; lng: number },
  stops: Stop[],
  includeActivities: boolean = true
): TripEstimate {
  let totalTransport = 0;
  let totalAccommodation = 0;
  let totalMeals = 0;
  let totalActivities = 0;
  const breakdown = [];

  // Add trip from origin to first stop
  if (stops.length > 0) {
    const firstStop = stops[0];
    const distance = calculateDistance(
      origin.lat, origin.lng,
      firstStop.city.lat, firstStop.city.lng
    );
    
    const transportCost = distance * TRANSPORT_COST_PER_KM;
    const nights = calculateNights(firstStop.arrivalDate, firstStop.departureDate);
    const accommodationCost = nights * ACCOMMODATION_COST_PER_NIGHT;
    const mealsCost = (nights + 1) * MEAL_COST * 3; // 3 meals per day
    const activitiesCost = includeActivities 
      ? firstStop.activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) * ACTIVITY_COST_MULTIPLIER
      : 0;
    
    totalTransport += transportCost;
    totalAccommodation += accommodationCost;
    totalMeals += mealsCost;
    totalActivities += activitiesCost;

    breakdown.push({
      from: origin.name,
      to: firstStop.city.name,
      distance: Math.round(distance * 10) / 10,
      transportCost: Math.round(transportCost * 100) / 100,
      nights,
      accommodationCost: Math.round(accommodationCost * 100) / 100,
      mealsCost: Math.round(mealsCost * 100) / 100,
      activitiesCost: Math.round(activitiesCost * 100) / 100,
      subtotal: Math.round((transportCost + accommodationCost + mealsCost + activitiesCost) * 100) / 100,
    });
  }

  // Calculate between stops
  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i];
    const next = stops[i + 1];
    
    const distance = calculateDistance(
      current.city.lat, current.city.lng,
      next.city.lat, next.city.lng
    );
    
    const transportCost = distance * TRANSPORT_COST_PER_KM;
    const nights = calculateNights(next.arrivalDate, next.departureDate);
    const accommodationCost = nights * ACCOMMODATION_COST_PER_NIGHT;
    const mealsCost = (nights + 1) * MEAL_COST * 3; // 3 meals per day
    const activitiesCost = includeActivities
      ? next.activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) * ACTIVITY_COST_MULTIPLIER
      : 0;
    
    totalTransport += transportCost;
    totalAccommodation += accommodationCost;
    totalMeals += mealsCost;
    totalActivities += activitiesCost;

    breakdown.push({
      from: current.city.name,
      to: next.city.name,
      distance: Math.round(distance * 10) / 10,
      transportCost: Math.round(transportCost * 100) / 100,
      nights,
      accommodationCost: Math.round(accommodationCost * 100) / 100,
      mealsCost: Math.round(mealsCost * 100) / 100,
      activitiesCost: Math.round(activitiesCost * 100) / 100,
      subtotal: Math.round((transportCost + accommodationCost + mealsCost + activitiesCost) * 100) / 100,
    });
  }

  // Add trip from last stop back to origin if there are stops
  if (stops.length > 0) {
    const lastStop = stops[stops.length - 1];
    const distance = calculateDistance(
      lastStop.city.lat, lastStop.city.lng,
      origin.lat, origin.lng
    );
    
    const transportCost = distance * TRANSPORT_COST_PER_KM;
    totalTransport += transportCost;

    breakdown.push({
      from: lastStop.city.name,
      to: origin.name,
      distance: Math.round(distance * 10) / 10,
      transportCost: Math.round(transportCost * 100) / 100,
      nights: 0,
      accommodationCost: 0,
      mealsCost: 0,
      activitiesCost: 0,
      subtotal: Math.round(transportCost * 100) / 100,
    });
  }

  return {
    transport: Math.round(totalTransport * 100) / 100,
    accommodation: Math.round(totalAccommodation * 100) / 100,
    meals: Math.round(totalMeals * 100) / 100,
    activities: Math.round(totalActivities * 100) / 100,
    total: Math.round((totalTransport + totalAccommodation + totalMeals + totalActivities) * 100) / 100,
    breakdown,
  };
}
