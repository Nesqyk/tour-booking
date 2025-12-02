-- =============================================
-- Authentication Seed Data
-- Default admin and customer accounts
-- =============================================

USE rufbac_tours;

-- Default admin account: admin@rufbac.com / password
-- Default customer account: customer@rufbac.com / password
-- Passwords are hashed using password_hash() with PASSWORD_DEFAULT

INSERT INTO users (email, password, user_type) VALUES
('admin@rufbac.com', '$2y$10$TFmG8ouDRl49ATGF1eANq.cSNfIE2aEWgbzYznsXJbZKVWOjKxxJW', 'admin'),
('customer@rufbac.com', '$2y$10$TFmG8ouDRl49ATGF1eANq.cSNfIE2aEWgbzYznsXJbZKVWOjKxxJW', 'customer')
ON DUPLICATE KEY UPDATE email=email;

-- Note: Default password for both accounts is "password"
-- In production, change these passwords immediately!

