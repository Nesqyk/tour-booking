-- =============================================
-- Rufbac Tour System (RTS) Seed Data
-- Sample data for testing and development
-- =============================================

USE rufbac_tours;

-- =============================================
-- Sample Tours
-- =============================================
INSERT INTO tours (destination, description, start_date, end_date, capacity, price, status, image_url) VALUES

-- Active Tours
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

-- Inactive/Past Tours
('Christmas Markets, Germany', 
 'Visit the magical Christmas markets of Munich, Nuremberg, and Rothenburg. Includes traditional crafts and culinary delights.',
 '2024-12-10', '2024-12-18', 25, 1899.99, 'inactive',
 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800'),

('New Zealand Adventure', 
 'From Hobbiton to Milford Sound, experience the best of both islands. Includes bungee jumping and Maori cultural experiences.',
 '2025-01-10', '2025-01-24', 12, 6299.99, 'inactive',
 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800');

-- =============================================
-- Sample Customers
-- =============================================
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

-- =============================================
-- Sample Bookings
-- =============================================
INSERT INTO bookings (tour_id, customer_id, booking_date, num_guests, status, payment_status, total_amount, notes) VALUES

-- Santorini bookings
(1, 1, '2025-01-15', 2, 'confirmed', 'paid', 4999.98, 'Anniversary trip. Requested sea view room.'),
(1, 3, '2025-01-20', 1, 'confirmed', 'paid', 2499.99, 'Solo traveler. Interested in photography tours.'),
(1, 5, '2025-02-01', 2, 'pending', 'partial', 4999.98, 'Deposit paid. Final payment due Feb 15.'),

-- Machu Picchu bookings
(2, 2, '2025-01-10', 2, 'confirmed', 'paid', 6599.98, 'Honeymoon package. Added private guide.'),
(2, 6, '2025-01-25', 1, 'pending', 'unpaid', 3299.99, 'Awaiting passport details.'),
(2, 8, '2025-02-05', 3, 'confirmed', 'paid', 9899.97, 'Family trip with teenage son.'),

-- Safari bookings
(3, 4, '2025-02-10', 2, 'confirmed', 'paid', 9999.98, 'Requested hot air balloon experience.'),
(3, 7, '2025-02-15', 2, 'pending', 'partial', 9999.98, 'Wildlife photography enthusiasts.'),

-- Iceland bookings
(4, 9, '2025-01-05', 2, 'confirmed', 'paid', 5799.98, 'Celebrating retirement.'),
(4, 11, '2025-01-12', 1, 'confirmed', 'paid', 2899.99, 'Solo adventure seeker.'),
(4, 13, '2025-01-18', 2, 'pending', 'unpaid', 5799.98, 'First international trip.'),

-- Japan bookings
(5, 10, '2025-02-01', 2, 'confirmed', 'paid', 7599.98, 'Tea ceremony enthusiasts.'),
(5, 12, '2025-02-08', 4, 'pending', 'partial', 15199.96, 'Group of friends. One vegetarian.'),
(5, 14, '2025-02-12', 1, 'confirmed', 'paid', 3799.99, 'Cultural immersion focus.'),

-- Amalfi Coast bookings
(6, 1, '2025-03-01', 2, 'pending', 'unpaid', 6399.98, 'Second booking - loved Santorini!'),
(6, 15, '2025-03-05', 2, 'confirmed', 'paid', 6399.98, 'Celebrating 25th anniversary.'),

-- Bali bookings
(7, 3, '2025-02-20', 1, 'confirmed', 'paid', 2199.99, 'Yoga teacher seeking inspiration.'),
(7, 7, '2025-02-25', 2, 'pending', 'partial', 4399.98, 'Wellness retreat focus.'),

-- Patagonia bookings
(8, 4, '2025-06-01', 2, 'pending', 'unpaid', 10999.98, 'Experienced hikers. Need gear list.'),

-- Cancelled booking example
(1, 2, '2024-12-01', 2, 'cancelled', 'refunded', 4999.98, 'Cancelled due to schedule conflict. Full refund processed.');

-- =============================================
-- Verify Data
-- =============================================
SELECT 'Tours' AS entity, COUNT(*) AS count FROM tours
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings;

-- Show dashboard stats
SELECT * FROM vw_dashboard_stats;

