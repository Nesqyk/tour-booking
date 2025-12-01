-- =============================================
-- Rufbac Tour System (RTS) Database Schema
-- Air Traffic Control Dashboard for Tour Booking
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS rufbac_tours
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE rufbac_tours;

-- =============================================
-- Tours Table
-- Stores information about available tour packages
-- =============================================
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
) ENGINE=InnoDB;

-- Index for status filtering
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_dates ON tours(start_date, end_date);

-- =============================================
-- Customers Table
-- Stores customer contact information
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint on email
    CONSTRAINT uq_customer_email UNIQUE (email)
) ENGINE=InnoDB;

-- Index for name lookups (email already indexed by UNIQUE constraint)
CREATE INDEX idx_customers_name ON customers(last_name, first_name);

-- =============================================
-- Bookings Table
-- Links tours to customers with booking details
-- =============================================
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
) ENGINE=InnoDB;

-- Indexes for common queries
-- Note: tour_id and customer_id are automatically indexed by MySQL for foreign keys
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_payment ON bookings(payment_status);

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
-- NOTES ON CHECK CONSTRAINTS
-- =============================================
-- CHECK constraints are enforced in MySQL 8.0.16+ and MariaDB 10.2.1+
-- In MySQL 5.7, CHECK constraints are parsed but NOT enforced.
-- Application-level validation is implemented in Booking.php for compatibility.
-- If using MySQL 5.7, rely on PHP validation rather than database CHECK constraints.
