-- =============================================
-- Create Users Table for Authentication
-- Ruf Bac Tour Services
-- =============================================

-- Use the existing database
USE rufbac_tours;

-- Create users table if it doesn't exist
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

-- Insert default admin and customer accounts
-- Password for both: "password"
INSERT INTO users (email, password, user_type) VALUES
('admin@rufbac.com', '$2y$10$TFmG8ouDRl49ATGF1eANq.cSNfIE2aEWgbzYznsXJbZKVWOjKxxJW', 'admin'),
('customer@rufbac.com', '$2y$10$TFmG8ouDRl49ATGF1eANq.cSNfIE2aEWgbzYznsXJbZKVWOjKxxJW', 'customer')
ON DUPLICATE KEY UPDATE email=email;

-- Verify table was created
SELECT 'Users table created successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;

