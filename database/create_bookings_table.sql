-- =============================================
-- Standalone Bookings Table Creation
-- Use this if you're having issues with the full schema
-- =============================================

-- Make sure tours and customers tables exist first!
-- Run schema.sql or create those tables before this.

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

-- Create indexes
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_payment ON bookings(payment_status);

