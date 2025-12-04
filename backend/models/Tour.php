<?php
/**
 * Tour Model Class
 * Handles tour-related database operations
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/../config/Database.php';

class Tour {
    private $db;
    private $table = 'tours';
    
    // Tour properties
    public $id;
    public $destination;
    public $description;
    public $start_date;
    public $end_date;
    public $capacity;
    public $price;
    public $status;
    public $image_url;
    public $created_at;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all active tours
     * @return array
     */
    public function getAll(): array {
        $sql = "SELECT * FROM {$this->table} WHERE status = 'active' ORDER BY start_date ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Get all tours including inactive
     * @return array
     */
    public function getAllIncludingInactive(): array {
        $sql = "SELECT * FROM {$this->table} ORDER BY start_date DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Get tour by ID
     * @param int $id
     * @return array|false
     */
    public function getById(int $id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Check if tour exists
     * @param int $id
     * @return bool
     */
    public function exists(int $id): bool {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Get available slots for a tour
     * @param int $tourId
     * @return int
     */
    public function getAvailableSlots(int $tourId): int {
        // Get tour capacity
        $tour = $this->getById($tourId);
        if (!$tour) {
            return 0;
        }
        
        // Count current bookings (excluding cancelled)
        $sql = "SELECT COALESCE(SUM(num_guests), 0) as booked 
                FROM bookings 
                WHERE tour_id = :tour_id AND status != 'cancelled'";
        $stmt = $this->db->query($sql, ['tour_id' => $tourId]);
        $result = $stmt->fetch();
        
        $bookedSlots = (int) $result['booked'];
        $availableSlots = $tour['capacity'] - $bookedSlots;
        
        return max(0, $availableSlots);
    }
    
    /**
     * Check if tour has capacity for given number of guests
     * @param int $tourId
     * @param int $numGuests
     * @param int|null $excludeBookingId - Exclude this booking from capacity check (for updates)
     * @return bool
     */
    public function hasCapacity(int $tourId, int $numGuests, ?int $excludeBookingId = null): bool {
        $tour = $this->getById($tourId);
        if (!$tour) {
            return false;
        }
        
        // Count current bookings (excluding cancelled and optionally the booking being updated)
        $sql = "SELECT COALESCE(SUM(num_guests), 0) as booked 
                FROM bookings 
                WHERE tour_id = :tour_id AND status != 'cancelled'";
        $params = ['tour_id' => $tourId];
        
        if ($excludeBookingId !== null) {
            $sql .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeBookingId;
        }
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        
        $bookedSlots = (int) $result['booked'];
        $availableSlots = $tour['capacity'] - $bookedSlots;
        
        return $numGuests <= $availableSlots;
    }
    
    /**
     * Get upcoming tours (starting in the future)
     * @return array
     */
    public function getUpcoming(): array {
        $sql = "SELECT * FROM {$this->table} 
                WHERE status = 'active' AND start_date > CURDATE() 
                ORDER BY start_date ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Get tours by status
     * @param string $status
     * @return array
     */
    public function getByStatus(string $status): array {
        $sql = "SELECT * FROM {$this->table} WHERE status = :status ORDER BY start_date ASC";
        $stmt = $this->db->query($sql, ['status' => $status]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get tours by destination name (case-insensitive partial match)
     * @param string $destinationName - Name of the destination to match
     * @return array - Array of active tours matching the destination name
     */
    public function getByDestinationName(string $destinationName): array {
        // Use case-insensitive LIKE matching for flexibility
        // This allows partial matches (e.g., "Island Paradise Tour" matches "Island Paradise")
        $sql = "SELECT * FROM {$this->table} 
                WHERE status = 'active' 
                AND LOWER(destination) LIKE LOWER(:name) 
                ORDER BY start_date ASC";
        
        // Add wildcards for partial matching
        $searchPattern = '%' . trim($destinationName) . '%';
        
        $stmt = $this->db->query($sql, ['name' => $searchPattern]);
        return $stmt->fetchAll();
    }
    
    /**
     * Create a new tour
     * @param array $data
     * @return int - New tour ID
     */
    public function create(array $data): int {
        // Validate required fields
        $required = ['destination', 'start_date', 'end_date', 'capacity', 'price'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("Field '{$field}' is required.");
            }
        }
        
        // Validate dates
        $startDate = new DateTime($data['start_date']);
        $endDate = new DateTime($data['end_date']);
        if ($endDate < $startDate) {
            throw new Exception("End date must be after start date.");
        }
        
        // Validate capacity
        $capacity = (int) $data['capacity'];
        if ($capacity <= 0) {
            throw new Exception("Capacity must be greater than 0.");
        }
        
        // Validate price
        $price = (float) $data['price'];
        if ($price < 0) {
            throw new Exception("Price cannot be negative.");
        }
        
        $sql = "INSERT INTO {$this->table} (destination, description, start_date, end_date, capacity, price, status, image_url) 
                VALUES (:destination, :description, :start_date, :end_date, :capacity, :price, :status, :image_url)";
        
        $this->db->query($sql, [
            'destination' => $data['destination'],
            'description' => $data['description'] ?? null,
            'start_date'  => $data['start_date'],
            'end_date'    => $data['end_date'],
            'capacity'    => $capacity,
            'price'       => $price,
            'status'      => $data['status'] ?? 'active',
            'image_url'   => $data['image_url'] ?? null
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Update a tour
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool {
        // Check tour exists
        if (!$this->exists($id)) {
            throw new Exception("Tour not found.");
        }
        
        // Validate dates if provided
        if (isset($data['start_date']) && isset($data['end_date'])) {
            $startDate = new DateTime($data['start_date']);
            $endDate = new DateTime($data['end_date']);
            if ($endDate < $startDate) {
                throw new Exception("End date must be after start date.");
            }
        }
        
        // Validate capacity if provided
        if (isset($data['capacity'])) {
            $capacity = (int) $data['capacity'];
            if ($capacity <= 0) {
                throw new Exception("Capacity must be greater than 0.");
            }
        }
        
        // Validate price if provided
        if (isset($data['price'])) {
            $price = (float) $data['price'];
            if ($price < 0) {
                throw new Exception("Price cannot be negative.");
            }
        }
        
        // Build update query dynamically
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['destination', 'description', 'start_date', 'end_date', 'capacity', 'price', 'status', 'image_url'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field] === '' ? null : $data[$field];
            }
        }
        
        if (empty($fields)) {
            throw new Exception("No fields to update.");
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $this->db->query($sql, $params);
        
        return true;
    }
    
    /**
     * Delete a tour
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        // Check tour exists
        if (!$this->exists($id)) {
            throw new Exception("Tour not found.");
        }
        
        // Check if tour has active bookings
        $sql = "SELECT COUNT(*) as count FROM bookings 
                WHERE tour_id = :tour_id AND status != 'cancelled'";
        $stmt = $this->db->query($sql, ['tour_id' => $id]);
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            throw new Exception("Cannot delete tour with active bookings. Cancel bookings first or set tour to inactive.");
        }
        
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        
        return true;
    }
}

