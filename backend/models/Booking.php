<?php
/**
 * Booking Model Class
 * Core business logic with validation and CRUD operations
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/Tour.php';
require_once __DIR__ . '/Customer.php';

class Booking {
    private $db;
    private $table = 'bookings';
    private $tour;
    private $customer;
    
    // Valid status values
    const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'];
    const VALID_PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'];
    
    // Booking properties
    public $id;
    public $tour_id;
    public $customer_id;
    public $booking_date;
    public $num_guests;
    public $status;
    public $payment_status;
    public $total_amount;
    public $notes;
    public $created_at;
    public $updated_at;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
        $this->tour = new Tour();
        $this->customer = new Customer();
    }
    
    // =========================================
    // VALIDATION METHODS
    // =========================================
    
    /**
     * Validate tour ID exists and is active
     * @param int $tourId
     * @throws Exception
     * @return bool
     */
    public function validateTourId(int $tourId): bool {
        $tour = $this->tour->getById($tourId);
        
        if (!$tour) {
            throw new Exception("Tour not found.");
        }
        
        if ($tour['status'] !== 'active') {
            throw new Exception("This tour is no longer available for booking.");
        }
        
        return true;
    }
    
    /**
     * Validate customer ID exists
     * @param int $customerId
     * @throws Exception
     * @return bool
     */
    public function validateCustomerId(int $customerId): bool {
        if (!$this->customer->exists($customerId)) {
            throw new Exception("Customer not found.");
        }
        return true;
    }
    
    /**
     * Validate booking date
     * @param string $date
     * @throws Exception
     * @return bool
     */
    public function validateBookingDate(string $date): bool {
        // Check if date is valid format
        $dateObj = DateTime::createFromFormat('Y-m-d', $date);
        if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
            throw new Exception("Invalid date format. Use YYYY-MM-DD.");
        }
        
        // Note: We allow booking dates in the past for historical records
        // but warn for dates more than 1 year in past
        $oneYearAgo = new DateTime('-1 year');
        if ($dateObj < $oneYearAgo) {
            throw new Exception("Booking date cannot be more than 1 year in the past.");
        }
        
        // Don't allow dates more than 2 years in future
        $twoYearsAhead = new DateTime('+2 years');
        if ($dateObj > $twoYearsAhead) {
            throw new Exception("Booking date cannot be more than 2 years in the future.");
        }
        
        return true;
    }
    
    /**
     * Validate booking status
     * @param string $status
     * @throws Exception
     * @return bool
     */
    public function validateStatus(string $status): bool {
        if (!in_array($status, self::VALID_STATUSES)) {
            throw new Exception("Invalid status. Must be: " . implode(', ', self::VALID_STATUSES));
        }
        return true;
    }
    
    /**
     * Validate payment status
     * @param string $paymentStatus
     * @throws Exception
     * @return bool
     */
    public function validatePaymentStatus(string $paymentStatus): bool {
        if (!in_array($paymentStatus, self::VALID_PAYMENT_STATUSES)) {
            throw new Exception("Invalid payment status. Must be: " . implode(', ', self::VALID_PAYMENT_STATUSES));
        }
        return true;
    }
    
    /**
     * Validate number of guests
     * @param int $numGuests
     * @throws Exception
     * @return bool
     */
    public function validateNumGuests(int $numGuests): bool {
        if ($numGuests < 1) {
            throw new Exception("Number of guests must be at least 1.");
        }
        if ($numGuests > 20) {
            throw new Exception("Number of guests cannot exceed 20 per booking.");
        }
        return true;
    }
    
    /**
     * Validate total amount
     * @param float $amount
     * @throws Exception
     * @return bool
     */
    public function validateTotalAmount(float $amount): bool {
        if ($amount < 0) {
            throw new Exception("Total amount cannot be negative.");
        }
        return true;
    }
    
    /**
     * Check tour availability for booking
     * @param int $tourId
     * @param int $numGuests
     * @param int|null $excludeBookingId
     * @throws Exception
     * @return bool
     */
    public function checkAvailability(int $tourId, int $numGuests, ?int $excludeBookingId = null): bool {
        if (!$this->tour->hasCapacity($tourId, $numGuests, $excludeBookingId)) {
            $available = $this->tour->getAvailableSlots($tourId);
            throw new Exception("Not enough capacity. Only {$available} slot(s) available.");
        }
        return true;
    }
    
    /**
     * Validate all booking data
     * @param array $data
     * @param int|null $excludeBookingId - For updates, exclude current booking from capacity check
     * @throws Exception
     */
    private function validateBookingData(array $data, ?int $excludeBookingId = null): void {
        // Required fields
        if (empty($data['tour_id'])) {
            throw new Exception("Tour is required.");
        }
        if (empty($data['customer_id'])) {
            throw new Exception("Customer is required.");
        }
        if (empty($data['booking_date'])) {
            throw new Exception("Booking date is required.");
        }
        
        // Type conversions
        $tourId = (int) $data['tour_id'];
        $customerId = (int) $data['customer_id'];
        $numGuests = isset($data['num_guests']) ? (int) $data['num_guests'] : 1;
        $totalAmount = isset($data['total_amount']) ? (float) $data['total_amount'] : 0;
        $status = $data['status'] ?? 'pending';
        $paymentStatus = $data['payment_status'] ?? 'unpaid';
        
        // Run validations
        $this->validateTourId($tourId);
        $this->validateCustomerId($customerId);
        $this->validateBookingDate($data['booking_date']);
        $this->validateNumGuests($numGuests);
        $this->validateStatus($status);
        $this->validatePaymentStatus($paymentStatus);
        $this->validateTotalAmount($totalAmount);
        
        // Check availability only for non-cancelled bookings
        if ($status !== 'cancelled') {
            $this->checkAvailability($tourId, $numGuests, $excludeBookingId);
        }
    }
    
    // =========================================
    // CRUD METHODS
    // =========================================
    
    /**
     * Create a new booking
     * @param array $data
     * @return array - Created booking with details
     */
    public function create(array $data): array {
        // Validate all data
        $this->validateBookingData($data);
        
        // Calculate total if not provided
        if (empty($data['total_amount'])) {
            $tour = $this->tour->getById($data['tour_id']);
            $numGuests = isset($data['num_guests']) ? (int) $data['num_guests'] : 1;
            $data['total_amount'] = $tour['price'] * $numGuests;
        }
        
        $sql = "INSERT INTO {$this->table} 
                (tour_id, customer_id, booking_date, num_guests, status, payment_status, total_amount, notes) 
                VALUES (:tour_id, :customer_id, :booking_date, :num_guests, :status, :payment_status, :total_amount, :notes)";
        
        $this->db->query($sql, [
            'tour_id'        => (int) $data['tour_id'],
            'customer_id'    => (int) $data['customer_id'],
            'booking_date'   => $data['booking_date'],
            'num_guests'     => isset($data['num_guests']) ? (int) $data['num_guests'] : 1,
            'status'         => $data['status'] ?? 'pending',
            'payment_status' => $data['payment_status'] ?? 'unpaid',
            'total_amount'   => (float) $data['total_amount'],
            'notes'          => $data['notes'] ?? null
        ]);
        
        $newId = (int) $this->db->lastInsertId();
        return $this->read($newId);
    }
    
    /**
     * Read a single booking with tour and customer details
     * @param int $id
     * @return array|false
     */
    public function read(int $id) {
        $sql = "SELECT * FROM vw_booking_details WHERE booking_id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Read all bookings with optional filters
     * @param array $filters - Optional filters (status, payment_status, tour_id, customer_id, date_from, date_to)
     * @return array
     */
    public function readAll(array $filters = []): array {
        $sql = "SELECT * FROM vw_booking_details WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters['status'])) {
            $sql .= " AND booking_status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['payment_status'])) {
            $sql .= " AND payment_status = :payment_status";
            $params['payment_status'] = $filters['payment_status'];
        }
        
        if (!empty($filters['tour_id'])) {
            $sql .= " AND tour_id = :tour_id";
            $params['tour_id'] = (int) $filters['tour_id'];
        }
        
        if (!empty($filters['customer_id'])) {
            $sql .= " AND customer_id = :customer_id";
            $params['customer_id'] = (int) $filters['customer_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND booking_date >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND booking_date <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        // Search by customer name or destination
        if (!empty($filters['search'])) {
            $sql .= " AND (customer_name LIKE :search OR destination LIKE :search OR email LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        // Sorting
        $sortField = $filters['sort'] ?? 'booking_created';
        $sortDir = strtoupper($filters['order'] ?? 'DESC');
        $sortDir = in_array($sortDir, ['ASC', 'DESC']) ? $sortDir : 'DESC';
        
        $allowedSortFields = ['booking_id', 'booking_date', 'booking_created', 'total_amount', 'customer_name', 'destination'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'booking_created';
        }
        
        $sql .= " ORDER BY {$sortField} {$sortDir}";
        
        // Pagination
        if (isset($filters['limit'])) {
            $limit = (int) $filters['limit'];
            $offset = isset($filters['offset']) ? (int) $filters['offset'] : 0;
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Update a booking
     * @param int $id
     * @param array $data
     * @return array - Updated booking with details
     */
    public function update(int $id, array $data): array {
        // Check booking exists
        $existing = $this->read($id);
        if (!$existing) {
            throw new Exception("Booking not found.");
        }
        
        // Merge existing data with updates
        $mergedData = [
            'tour_id'        => $data['tour_id'] ?? $existing['tour_id'],
            'customer_id'    => $data['customer_id'] ?? $existing['customer_id'],
            'booking_date'   => $data['booking_date'] ?? $existing['booking_date'],
            'num_guests'     => $data['num_guests'] ?? $existing['num_guests'],
            'status'         => $data['status'] ?? $existing['booking_status'],
            'payment_status' => $data['payment_status'] ?? $existing['payment_status'],
            'total_amount'   => $data['total_amount'] ?? $existing['total_amount'],
            'notes'          => array_key_exists('notes', $data) ? $data['notes'] : $existing['notes']
        ];
        
        // Validate all data (exclude current booking from capacity check)
        $this->validateBookingData($mergedData, $id);
        
        $sql = "UPDATE {$this->table} 
                SET tour_id = :tour_id,
                    customer_id = :customer_id,
                    booking_date = :booking_date,
                    num_guests = :num_guests,
                    status = :status,
                    payment_status = :payment_status,
                    total_amount = :total_amount,
                    notes = :notes
                WHERE id = :id";
        
        $this->db->query($sql, [
            'id'             => $id,
            'tour_id'        => (int) $mergedData['tour_id'],
            'customer_id'    => (int) $mergedData['customer_id'],
            'booking_date'   => $mergedData['booking_date'],
            'num_guests'     => (int) $mergedData['num_guests'],
            'status'         => $mergedData['status'],
            'payment_status' => $mergedData['payment_status'],
            'total_amount'   => (float) $mergedData['total_amount'],
            'notes'          => $mergedData['notes']
        ]);
        
        return $this->read($id);
    }
    
    /**
     * Delete a booking (soft delete by setting status to cancelled, or hard delete)
     * @param int $id
     * @param bool $hardDelete - If true, permanently delete. If false, set status to cancelled.
     * @return bool
     */
    public function delete(int $id, bool $hardDelete = false): bool {
        // Check booking exists
        if (!$this->read($id)) {
            throw new Exception("Booking not found.");
        }
        
        if ($hardDelete) {
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
        } else {
            // Soft delete - set status to cancelled and payment to refunded
            $sql = "UPDATE {$this->table} SET status = 'cancelled', payment_status = 'refunded' WHERE id = :id";
        }
        
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->rowCount() > 0;
    }
    
    // =========================================
    // HELPER METHODS
    // =========================================
    
    /**
     * Get dashboard statistics
     * @return array
     */
    public function getDashboardStats(): array {
        $sql = "SELECT * FROM vw_dashboard_stats";
        $stmt = $this->db->query($sql);
        $stats = $stmt->fetch();
        
        // Get recent bookings count (last 7 days)
        $sql = "SELECT COUNT(*) as recent_bookings FROM {$this->table} 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmt = $this->db->query($sql);
        $recent = $stmt->fetch();
        
        // Get bookings by status for chart
        $sql = "SELECT status, COUNT(*) as count FROM {$this->table} GROUP BY status";
        $stmt = $this->db->query($sql);
        $statusBreakdown = $stmt->fetchAll();
        
        // Get upcoming tours with booking counts
        $sql = "SELECT t.id, t.destination, t.start_date, t.capacity,
                       COUNT(b.id) as booking_count,
                       COALESCE(SUM(b.num_guests), 0) as guests_booked
                FROM tours t
                LEFT JOIN bookings b ON t.id = b.tour_id AND b.status != 'cancelled'
                WHERE t.status = 'active' AND t.start_date > CURDATE()
                GROUP BY t.id
                ORDER BY t.start_date ASC
                LIMIT 5";
        $stmt = $this->db->query($sql);
        $upcomingTours = $stmt->fetchAll();
        
        return [
            'total_bookings'     => (int) $stats['total_bookings'],
            'pending_bookings'   => (int) $stats['pending_bookings'],
            'confirmed_bookings' => (int) $stats['confirmed_bookings'],
            'cancelled_bookings' => (int) $stats['cancelled_bookings'],
            'total_revenue'      => (float) $stats['total_revenue'],
            'collected_revenue'  => (float) $stats['collected_revenue'],
            'active_tours'       => (int) $stats['active_tours'],
            'total_customers'    => (int) $stats['total_customers'],
            'recent_bookings'    => (int) $recent['recent_bookings'],
            'status_breakdown'   => $statusBreakdown,
            'upcoming_tours'     => $upcomingTours
        ];
    }
    
    /**
     * Get booking count
     * @param array $filters
     * @return int
     */
    public function getCount(array $filters = []): int {
        $sql = "SELECT COUNT(*) as count FROM vw_booking_details WHERE 1=1";
        $params = [];
        
        if (!empty($filters['status'])) {
            $sql .= " AND booking_status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['payment_status'])) {
            $sql .= " AND payment_status = :payment_status";
            $params['payment_status'] = $filters['payment_status'];
        }
        
        if (!empty($filters['tour_id'])) {
            $sql .= " AND tour_id = :tour_id";
            $params['tour_id'] = (int) $filters['tour_id'];
        }
        
        if (!empty($filters['customer_id'])) {
            $sql .= " AND customer_id = :customer_id";
            $params['customer_id'] = (int) $filters['customer_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND booking_date >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND booking_date <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (customer_name LIKE :search OR destination LIKE :search OR email LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        return (int) $result['count'];
    }
    
    /**
     * Check if a booking exists
     * @param int $id
     * @return bool
     */
    public function exists(int $id): bool {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
}

