-- =============================================
-- Landing Page Seed Data
-- Sample data for services, destinations, and fleet
-- =============================================

USE rufbac_tours;

-- =============================================
-- Services Data
-- =============================================
INSERT INTO services (service_type, name, description, icon_class, benefits, image_url, is_active, display_order) VALUES
('rental', 'Car & Van Rentals', 'Explore at your own pace with our premium rental fleet. From compact cars to spacious vans, we have the perfect vehicle for your adventure.', 'bi bi-car-front', '["Flexible rental periods", "Comprehensive insurance", "24/7 roadside assistance"]', NULL, TRUE, 1),
('tour', 'Island Tours', 'Discover hidden gems and popular attractions with our expertly guided tours. Let our local experts show you the best of the islands.', 'bi bi-geo-alt', '["Expert local guides", "Curated itineraries", "Small group sizes"]', NULL, TRUE, 2),
('shuttle', 'Shuttle Services', 'Reliable airport transfers and point-to-point transportation. Safe, comfortable, and punctual service for all your travel needs.', 'bi bi-bus-front', '["Airport transfers", "Hotel pickups", "Group transportation"]', NULL, TRUE, 3);

-- =============================================
-- Destinations Data
-- =============================================
INSERT INTO destinations (name, description, duration_hours, max_capacity, image_url, is_featured, display_order) VALUES
('Island Paradise Tour', 'Experience pristine beaches, crystal-clear waters, and tropical landscapes on this full-day adventure.', 8, 12, NULL, TRUE, 1),
('Coastal Adventure', 'Journey along stunning coastlines with stops at hidden coves, scenic viewpoints, and local villages.', 6, 8, NULL, TRUE, 2),
('Cultural Discovery', 'Immerse yourself in local culture, traditions, and cuisine with visits to historic sites and markets.', 5, 10, NULL, TRUE, 3);

-- =============================================
-- Fleet Data
-- =============================================
INSERT INTO fleet (vehicle_type, description, capacity, features, price_per_day, image_url, is_featured, display_order) VALUES
('Premium Van', 'Spacious and comfortable, perfect for families and groups up to 12 passengers.', 12, '["12 Passenger Capacity", "Air Conditioning", "GPS Navigation", "Premium Seating"]', 89.00, NULL, FALSE, 1),
('Luxury SUV', 'Premium comfort and style for smaller groups. Perfect for couples and families.', 7, '["7 Passenger Capacity", "Leather Interior", "Premium Sound System", "All-Wheel Drive"]', 129.00, NULL, TRUE, 2),
('Shuttle Bus', 'Ideal for airport transfers, group tours, and large party transportation.', 15, '["15 Passenger Capacity", "Luggage Storage", "Professional Driver", "Comfort Seating"]', 149.00, NULL, FALSE, 3);

