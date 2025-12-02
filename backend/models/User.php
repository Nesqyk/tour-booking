<?php
/**
 * User Model Class
 * Handles user-related database operations for authentication
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/../config/Database.php';

class User {
    private $db;
    private $table = 'users';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get user by email
     * @param string $email
     * @return array|false
     */
    public function getByEmail(string $email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email";
        $stmt = $this->db->query($sql, ['email' => $email]);
        return $stmt->fetch();
    }
    
    /**
     * Get user by ID
     * @param int $id
     * @return array|false
     */
    public function getById(int $id) {
        $sql = "SELECT id, email, user_type, created_at FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Check if email exists
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
     * Create a new user
     * @param array $data
     * @return int - New user ID
     */
    public function create(array $data): int {
        // Validate required fields
        $required = ['email', 'password', 'user_type'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("Field '{$field}' is required.");
            }
        }
        
        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format.");
        }
        
        // Validate user_type
        $validTypes = ['admin', 'customer'];
        if (!in_array($data['user_type'], $validTypes)) {
            throw new Exception("Invalid user_type. Must be: admin or customer.");
        }
        
        // Check if email already exists
        if ($this->emailExists($data['email'])) {
            throw new Exception("Email already registered.");
        }
        
        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $sql = "INSERT INTO {$this->table} (email, password, user_type) 
                VALUES (:email, :password, :user_type)";
        
        $this->db->query($sql, [
            'email' => $data['email'],
            'password' => $hashedPassword,
            'user_type' => $data['user_type']
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Verify user credentials
     * @param string $email
     * @param string $password
     * @return array|false - User data if valid, false otherwise
     */
    public function verifyCredentials(string $email, string $password) {
        $user = $this->getByEmail($email);
        
        if (!$user) {
            return false;
        }
        
        if (!password_verify($password, $user['password'])) {
            return false;
        }
        
        // Return user data without password
        return [
            'id' => $user['id'],
            'email' => $user['email'],
            'user_type' => $user['user_type'],
            'created_at' => $user['created_at']
        ];
    }
    
    /**
     * Update user password
     * @param int $id
     * @param string $newPassword
     * @return bool
     */
    public function updatePassword(int $id, string $newPassword): bool {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        $sql = "UPDATE {$this->table} SET password = :password WHERE id = :id";
        $this->db->query($sql, [
            'id' => $id,
            'password' => $hashedPassword
        ]);
        
        return true;
    }
}

