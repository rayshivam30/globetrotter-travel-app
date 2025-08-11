-- Create database tables for GlobeTrotter (PostgreSQL)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image VARCHAR(500),
  is_public BOOLEAN DEFAULT FALSE,
  total_budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  cost_index DECIMAL(5,2) DEFAULT 100,
  popularity_score INTEGER DEFAULT 0,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  description TEXT,
  image_url VARCHAR(500),
  UNIQUE(name, country)
);

-- Trip stops table
CREATE TABLE IF NOT EXISTS trip_stops (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL,
  city_id INTEGER NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  order_index INTEGER NOT NULL,
  accommodation_budget DECIMAL(10,2) DEFAULT 0,
  transport_budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  duration_hours INTEGER DEFAULT 2,
  image_url VARCHAR(500),
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Trip activities table
CREATE TABLE IF NOT EXISTS trip_activities (
  id SERIAL PRIMARY KEY,
  trip_stop_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  actual_cost DECIMAL(10,2),
  notes TEXT,
  FOREIGN KEY (trip_stop_id) REFERENCES trip_stops(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

-- Insert sample cities (only if they don't exist)
INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'Paris', 'France', 120.5, 95, 'The City of Light, famous for its art, fashion, and cuisine'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Paris' AND country = 'France');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'Tokyo', 'Japan', 110.8, 90, 'A vibrant metropolis blending tradition and modernity'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Tokyo' AND country = 'Japan');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'New York', 'USA', 130.2, 88, 'The city that never sleeps, known for its skyline and culture'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'New York' AND country = 'USA');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'London', 'UK', 125.7, 92, 'Historic city with royal palaces and modern attractions'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'London' AND country = 'UK');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'Barcelona', 'Spain', 95.3, 85, 'Mediterranean city known for Gaudí architecture and beaches'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Barcelona' AND country = 'Spain');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'Rome', 'Italy', 105.4, 87, 'The Eternal City with ancient history and incredible food'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Rome' AND country = 'Italy');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'Amsterdam', 'Netherlands', 115.6, 82, 'Canal city famous for its museums and liberal culture'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Amsterdam' AND country = 'Netherlands');

INSERT INTO cities (name, country, cost_index, popularity_score, description) 
SELECT 'Bangkok', 'Thailand', 65.2, 80, 'Bustling capital known for temples, street food, and nightlife'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Bangkok' AND country = 'Thailand');

-- Insert sample activities (only if they don't exist)
INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 1, 'Eiffel Tower Visit', 'Iconic iron tower with city views', 'Sightseeing', 25.00, 3
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Eiffel Tower Visit' AND city_id = 1);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 1, 'Louvre Museum', 'World famous art museum', 'Culture', 17.00, 4
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Louvre Museum' AND city_id = 1);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 1, 'Seine River Cruise', 'Scenic boat tour along the Seine', 'Leisure', 15.00, 2
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Seine River Cruise' AND city_id = 1);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 2, 'Tokyo Skytree', 'Tallest structure in Japan with panoramic views', 'Sightseeing', 20.00, 2
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Tokyo Skytree' AND city_id = 2);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 2, 'Sushi Making Class', 'Learn to make authentic sushi', 'Food', 80.00, 3
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Sushi Making Class' AND city_id = 2);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 2, 'Shibuya Crossing Experience', 'Famous pedestrian crossing', 'Culture', 0.00, 1
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Shibuya Crossing Experience' AND city_id = 2);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 3, 'Statue of Liberty', 'Iconic symbol of freedom', 'Sightseeing', 23.00, 4
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Statue of Liberty' AND city_id = 3);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 3, 'Central Park Walk', 'Peaceful green space in Manhattan', 'Leisure', 0.00, 2
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Central Park Walk' AND city_id = 3);

INSERT INTO activities (city_id, name, description, category, estimated_cost, duration_hours)
SELECT 3, 'Broadway Show', 'World-class theater performance', 'Entertainment', 150.00, 3
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Broadway Show' AND city_id = 3);
