-- =============================================
-- Ruf Bac Tour Services - Complete Database Setup
-- Creates all tables and seeds initial data
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS rufbac_tours
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE rufbac_tours;

-- =============================================
-- Core Tables: Tours, Customers, Bookings
-- =============================================

-- Tours Table
CREATE TABLE IF NOT EXISTS tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tour_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_tour_capacity CHECK (capacity > 0),
    CONSTRAINT chk_tour_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_dates ON tours(start_date, end_date);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_email UNIQUE (email),
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_customers_name ON customers(last_name, first_name);
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    customer_id INT NOT NULL,
    booking_date DATE NOT NULL,
    num_guests INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_tour FOREIGN KEY (tour_id) 
        REFERENCES tours(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_booking_guests CHECK (num_guests > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_payment ON bookings(payment_status);

-- =============================================
-- Authentication Table
-- =============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password',
    user_type ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Landing Page Tables
-- =============================================

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_type ENUM('rental', 'tour', 'shuttle') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_class VARCHAR(100) DEFAULT NULL,
    benefits TEXT DEFAULT NULL COMMENT 'JSON array or comma-separated list',
    image_url VARCHAR(500) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_type (service_type),
    INDEX idx_service_active (is_active),
    INDEX idx_service_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Destinations Table
CREATE TABLE IF NOT EXISTS destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_hours INT NOT NULL,
    max_capacity INT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_destinations_featured (is_featured),
    INDEX idx_destinations_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fleet Table
CREATE TABLE IF NOT EXISTS fleet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    features TEXT DEFAULT NULL COMMENT 'JSON array or comma-separated list',
    price_per_day DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fleet_featured (is_featured),
    INDEX idx_fleet_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Views for Dashboard Statistics
-- =============================================

-- View: Booking details with tour and customer info
CREATE OR REPLACE VIEW vw_booking_details AS
SELECT 
    b.id AS booking_id,
    b.booking_date,
    b.num_guests,
    b.status AS booking_status,
    b.payment_status,
    b.total_amount,
    b.notes,
    b.created_at AS booking_created,
    b.updated_at AS booking_updated,
    t.id AS tour_id,
    t.destination,
    t.start_date AS tour_start,
    t.end_date AS tour_end,
    t.price AS tour_price,
    t.capacity AS tour_capacity,
    c.id AS customer_id,
    c.first_name,
    c.last_name,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    c.phone
FROM bookings b
INNER JOIN tours t ON b.tour_id = t.id
INNER JOIN customers c ON b.customer_id = c.id;

-- View: Dashboard statistics
CREATE OR REPLACE VIEW vw_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM bookings) AS total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pending_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') AS confirmed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') AS cancelled_bookings,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status != 'cancelled') AS total_revenue,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid') AS collected_revenue,
    (SELECT COUNT(*) FROM tours WHERE status = 'active') AS active_tours,
    (SELECT COUNT(*) FROM customers) AS total_customers;

-- =============================================
-- Seed Data
-- =============================================

-- Sample Tours
INSERT INTO tours (destination, description, start_date, end_date, capacity, price, status, image_url) VALUES
('Santorini, Greece', 
 'Experience the breathtaking sunsets and iconic white-washed buildings of Santorini. Includes wine tasting, volcano tour, and beach excursions.',
 '2025-03-15', '2025-03-22', 20, 2499.99, 'active',
 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800'),
('Machu Picchu, Peru', 
 'Journey through the Sacred Valley to the ancient Incan citadel. Includes guided tours, local cuisine experiences, and optional Huayna Picchu hike.',
 '2025-04-10', '2025-04-18', 15, 3299.99, 'active',
 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800'),
('Safari Adventure, Kenya', 
 'Witness the Great Migration in the Maasai Mara. Luxury tented camps, expert guides, and unforgettable wildlife encounters.',
 '2025-05-01', '2025-05-10', 12, 4999.99, 'active',
 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'),
('Northern Lights, Iceland', 
 'Chase the Aurora Borealis across Iceland''s stunning landscapes. Includes Golden Circle tour, Blue Lagoon, and glacier hiking.',
 '2025-02-20', '2025-02-27', 18, 2899.99, 'active',
 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800'),
('Cherry Blossom, Japan', 
 'Experience hanami season in Tokyo and Kyoto. Traditional tea ceremonies, temple visits, and bullet train experiences included.',
 '2025-04-01', '2025-04-12', 16, 3799.99, 'active',
 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'),
('Amalfi Coast, Italy', 
 'Explore the stunning Italian coastline with visits to Positano, Ravello, and Capri. Includes cooking classes and wine tours.',
 '2025-06-15', '2025-06-23', 14, 3199.99, 'active',
 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800'),
('Bali Wellness Retreat', 
 'Rejuvenate in paradise with yoga sessions, spa treatments, and cultural experiences in Ubud and Seminyak.',
 '2025-05-20', '2025-05-28', 10, 2199.99, 'active',
 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'),
('Patagonia Explorer', 
 'Trek through Torres del Paine and witness glaciers in Argentina and Chile. For adventurous spirits seeking raw nature.',
 '2025-11-05', '2025-11-16', 8, 5499.99, 'active',
 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=800'),
('Christmas Markets, Germany', 
 'Visit the magical Christmas markets of Munich, Nuremberg, and Rothenburg. Includes traditional crafts and culinary delights.',
 '2024-12-10', '2024-12-18', 25, 1899.99, 'inactive',
 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800'),
('New Zealand Adventure', 
 'From Hobbiton to Milford Sound, experience the best of both islands. Includes bungee jumping and Maori cultural experiences.',
 '2025-01-10', '2025-01-24', 12, 6299.99, 'inactive',
 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800');

-- Sample Customers
INSERT INTO customers (first_name, last_name, email, phone, address) VALUES
('Emma', 'Thompson', 'emma.thompson@email.com', '+1-555-0101', '123 Oak Street, Boston, MA 02108'),
('James', 'Wilson', 'james.wilson@email.com', '+1-555-0102', '456 Maple Ave, New York, NY 10001'),
('Sofia', 'Rodriguez', 'sofia.rodriguez@email.com', '+1-555-0103', '789 Pine Road, Miami, FL 33101'),
('Michael', 'Chen', 'michael.chen@email.com', '+1-555-0104', '321 Cedar Lane, San Francisco, CA 94102'),
('Isabella', 'Martinez', 'isabella.martinez@email.com', '+1-555-0105', '654 Birch Blvd, Chicago, IL 60601'),
('William', 'Brown', 'william.brown@email.com', '+1-555-0106', '987 Elm Street, Seattle, WA 98101'),
('Olivia', 'Davis', 'olivia.davis@email.com', '+1-555-0107', '147 Spruce Ave, Denver, CO 80201'),
('Alexander', 'Garcia', 'alex.garcia@email.com', '+1-555-0108', '258 Willow Way, Austin, TX 78701'),
('Charlotte', 'Anderson', 'charlotte.anderson@email.com', '+1-555-0109', '369 Aspen Court, Portland, OR 97201'),
('Benjamin', 'Taylor', 'ben.taylor@email.com', '+1-555-0110', '741 Redwood Dr, Phoenix, AZ 85001'),
('Mia', 'Thomas', 'mia.thomas@email.com', '+1-555-0111', '852 Sequoia St, San Diego, CA 92101'),
('Ethan', 'Jackson', 'ethan.jackson@email.com', '+1-555-0112', '963 Cypress Ln, Nashville, TN 37201'),
('Ava', 'White', 'ava.white@email.com', '+1-555-0113', '159 Palm Ave, Las Vegas, NV 89101'),
('Lucas', 'Harris', 'lucas.harris@email.com', '+1-555-0114', '357 Magnolia Rd, Atlanta, GA 30301'),
('Amelia', 'Clark', 'amelia.clark@email.com', '+1-555-0115', '468 Dogwood Dr, Charlotte, NC 28201');

-- Sample Bookings
INSERT INTO bookings (tour_id, customer_id, booking_date, num_guests, status, payment_status, total_amount, notes) VALUES
(1, 1, '2025-01-15', 2, 'confirmed', 'paid', 4999.98, 'Anniversary trip. Requested sea view room.'),
(1, 3, '2025-01-20', 1, 'confirmed', 'paid', 2499.99, 'Solo traveler. Interested in photography tours.'),
(1, 5, '2025-02-01', 2, 'pending', 'partial', 4999.98, 'Deposit paid. Final payment due Feb 15.'),
(2, 2, '2025-01-10', 2, 'confirmed', 'paid', 6599.98, 'Honeymoon package. Added private guide.'),
(2, 6, '2025-01-25', 1, 'pending', 'unpaid', 3299.99, 'Awaiting passport details.'),
(2, 8, '2025-02-05', 3, 'confirmed', 'paid', 9899.97, 'Family trip with teenage son.'),
(3, 4, '2025-02-10', 2, 'confirmed', 'paid', 9999.98, 'Requested hot air balloon experience.'),
(3, 7, '2025-02-15', 2, 'pending', 'partial', 9999.98, 'Wildlife photography enthusiasts.'),
(4, 9, '2025-01-05', 2, 'confirmed', 'paid', 5799.98, 'Celebrating retirement.'),
(4, 11, '2025-01-12', 1, 'confirmed', 'paid', 2899.99, 'Solo adventure seeker.'),
(4, 13, '2025-01-18', 2, 'pending', 'unpaid', 5799.98, 'First international trip.'),
(5, 10, '2025-02-01', 2, 'confirmed', 'paid', 7599.98, 'Tea ceremony enthusiasts.'),
(5, 12, '2025-02-08', 4, 'pending', 'partial', 15199.96, 'Group of friends. One vegetarian.'),
(5, 14, '2025-02-12', 1, 'confirmed', 'paid', 3799.99, 'Cultural immersion focus.'),
(6, 1, '2025-03-01', 2, 'pending', 'unpaid', 6399.98, 'Second booking - loved Santorini!'),
(6, 15, '2025-03-05', 2, 'confirmed', 'paid', 6399.98, 'Celebrating 25th anniversary.'),
(7, 3, '2025-02-20', 1, 'confirmed', 'paid', 2199.99, 'Yoga teacher seeking inspiration.'),
(7, 7, '2025-02-25', 2, 'pending', 'partial', 4399.98, 'Wellness retreat focus.'),
(8, 4, '2025-06-01', 2, 'pending', 'unpaid', 10999.98, 'Experienced hikers. Need gear list.'),
(1, 2, '2024-12-01', 2, 'cancelled', 'refunded', 4999.98, 'Cancelled due to schedule conflict. Full refund processed.');

-- Authentication Users
-- Default password for both accounts is "password" (hashed with password_hash)
INSERT INTO users (email, password, user_type) VALUES
('admin@rufbac.com', '$2y$10$TFmG8ouDRl49ATGF1eANq.cSNfIE2aEWgbzYznsXJbZKVWOjKxxJW', 'admin'),
('customer@rufbac.com', '$2y$10$TFmG8ouDRl49ATGF1eANq.cSNfIE2aEWgbzYznsXJbZKVWOjKxxJW', 'customer')
ON DUPLICATE KEY UPDATE email=email;

-- Landing Page Services
INSERT INTO services (service_type, name, description, icon_class, benefits, image_url, is_active, display_order) VALUES
('rental', 'Car & Van Rentals', 'Explore at your own pace with our premium rental fleet. From compact cars to spacious vans, we have the perfect vehicle for your adventure.', 'bi bi-car-front', '["Flexible rental periods", "Comprehensive insurance", "24/7 roadside assistance"]', NULL, TRUE, 1),
('tour', 'Island Tours', 'Discover hidden gems and popular attractions with our expertly guided tours. Let our local experts show you the best of the islands.', 'bi bi-geo-alt', '["Expert local guides", "Curated itineraries", "Small group sizes"]', NULL, TRUE, 2),
('shuttle', 'Shuttle Services', 'Reliable airport transfers and point-to-point transportation. Safe, comfortable, and punctual service for all your travel needs.', 'bi bi-bus-front', '["Airport transfers", "Hotel pickups", "Group transportation"]', NULL, TRUE, 3);

-- Landing Page Destinations
INSERT INTO destinations (name, description, duration_hours, max_capacity, image_url, is_featured, display_order) VALUES
('Island Paradise Tour', 'Experience pristine beaches, crystal-clear waters, and tropical landscapes on this full-day adventure.', 8, 12, NULL, TRUE, 1),
('Coastal Adventure', 'Journey along stunning coastlines with stops at hidden coves, scenic viewpoints, and local villages.', 6, 8, NULL, TRUE, 2),
('Cultural Discovery', 'Immerse yourself in local culture, traditions, and cuisine with visits to historic sites and markets.', 5, 10, NULL, TRUE, 3);

-- Landing Page Fleet
INSERT INTO fleet (vehicle_type, description, capacity, features, price_per_day, image_url, is_featured, display_order) VALUES
('Premium Van', 'Spacious and comfortable, perfect for families and groups up to 12 passengers.', 12, '["12 Passenger Capacity", "Air Conditioning", "GPS Navigation", "Premium Seating"]', 89.00, NULL, FALSE, 1),
('Luxury SUV', 'Premium comfort and style for smaller groups. Perfect for couples and families.', 7, '["7 Passenger Capacity", "Leather Interior", "Premium Sound System", "All-Wheel Drive"]', 129.00, NULL, TRUE, 2),
('Shuttle Bus', 'Ideal for airport transfers, group tours, and large party transportation.', 15, '["15 Passenger Capacity", "Luggage Storage", "Professional Driver", "Comfort Seating"]', 149.00, NULL, FALSE, 3);

-- =============================================
-- Verification
-- =============================================
SELECT 'Database initialized successfully!' AS status;
SELECT 'Tours' AS entity, COUNT(*) AS count FROM tours
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Destinations', COUNT(*) FROM destinations
UNION ALL
SELECT 'Fleet', COUNT(*) FROM fleet;

