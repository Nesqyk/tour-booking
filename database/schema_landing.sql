-- =============================================
-- Landing Page Tables Schema
-- For Ruf Bac Tour Services Landing Page
-- =============================================

USE rufbac_tours;

-- =============================================
-- Services Table
-- Stores service offerings (rentals, tours, shuttles)
-- =============================================
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

-- =============================================
-- Destinations Table
-- Stores popular destinations for tours
-- =============================================
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

-- =============================================
-- Fleet Table
-- Stores vehicle fleet information
-- =============================================
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

