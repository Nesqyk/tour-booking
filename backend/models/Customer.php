<?php
/**
 * Customer Model Class
 * Handles customer-related database operations
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/../config/Database.php';

class Customer {
    private $db;
    private $table = 'customers';
    
    // Customer properties
    public $id;
    public $first_name;
    public $last_name;
    public $email;
    public $phone;
    public $address;
    public $created_at;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all customers
     * @return array
     */
    public function getAll(): array {
        $sql = "SELECT * FROM {$this->table} ORDER BY last_name, first_name ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Get customer by ID
     * @param int $id
     * @return array|false
     */
    public function getById(int $id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Check if customer exists
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
     * Get customer by email
     * @param string $email
     * @return array|false
     */
    public function getByEmail(string $email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email";
        $stmt = $this->db->query($sql, ['email' => $email]);
        return $stmt->fetch();
    }
    
    /**
     * Check if email exists (for validation)
     * @param string $email
     * @param int|null $excludeId - Exclude this ID from check (for updates)
     * @return bool
     */
    public function emailExists(string $email, ?int $excludeId = null): bool {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE email = :email";
        $params = ['email' => $email];
        
        if ($excludeId !== null) {
            $sql .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Create a new customer
     * @param array $data
     * @return int - New customer ID
     */
    public function create(array $data): int {
        // Validate required fields
        $this->validateCustomerData($data);
        
        // Check for duplicate email
        if ($this->emailExists($data['email'])) {
            throw new Exception("A customer with this email already exists.");
        }
        
        $sql = "INSERT INTO {$this->table} (first_name, last_name, email, phone, address) 
                VALUES (:first_name, :last_name, :email, :phone, :address)";
        
        $this->db->query($sql, [
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'phone'      => $data['phone'] ?? null,
            'address'    => $data['address'] ?? null
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Update a customer
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool {
        // Check customer exists
        if (!$this->exists($id)) {
            throw new Exception("Customer not found.");
        }
        
        // Validate data
        $this->validateCustomerData($data);
        
        // Check for duplicate email (excluding current customer)
        if ($this->emailExists($data['email'], $id)) {
            throw new Exception("A customer with this email already exists.");
        }
        
        $sql = "UPDATE {$this->table} 
                SET first_name = :first_name, 
                    last_name = :last_name, 
                    email = :email, 
                    phone = :phone, 
                    address = :address 
                WHERE id = :id";
        
        $stmt = $this->db->query($sql, [
            'id'         => $id,
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'phone'      => $data['phone'] ?? null,
            'address'    => $data['address'] ?? null
        ]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Delete a customer
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        if (!$this->exists($id)) {
            throw new Exception("Customer not found.");
        }
        
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Search customers by name or email
     * @param string $query
     * @return array
     */
    public function search(string $query): array {
        $searchTerm = '%' . $query . '%';
        $sql = "SELECT * FROM {$this->table} 
                WHERE first_name LIKE :query 
                   OR last_name LIKE :query 
                   OR email LIKE :query 
                ORDER BY last_name, first_name ASC";
        $stmt = $this->db->query($sql, ['query' => $searchTerm]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get customers with their booking count
     * @return array
     */
    public function getAllWithBookingCount(): array {
        $sql = "SELECT c.*, 
                       COUNT(b.id) as booking_count,
                       COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) as total_spent
                FROM {$this->table} c
                LEFT JOIN bookings b ON c.id = b.customer_id
                GROUP BY c.id
                ORDER BY c.last_name, c.first_name ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Validate customer data
     * @param array $data
     * @throws Exception
     */
    private function validateCustomerData(array $data): void {
        if (empty($data['first_name'])) {
            throw new Exception("First name is required.");
        }
        
        if (empty($data['last_name'])) {
            throw new Exception("Last name is required.");
        }
        
        if (empty($data['email'])) {
            throw new Exception("Email is required.");
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format.");
        }
        
        if (strlen($data['first_name']) > 100) {
            throw new Exception("First name must be 100 characters or less.");
        }
        
        if (strlen($data['last_name']) > 100) {
            throw new Exception("Last name must be 100 characters or less.");
        }
    }
}

