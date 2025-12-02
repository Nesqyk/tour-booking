<?php
/**
 * Destination Model Class
 * Handles destination-related database operations for landing page
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/../config/Database.php';

class Destination {
    private $db;
    private $table = 'destinations';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all destinations, optionally filtered by featured
     * @param bool $featuredOnly - If true, only return featured destinations
     * @return array
     */
    public function getAll(bool $featuredOnly = false): array {
        $sql = "SELECT * FROM {$this->table}";
        
        if ($featuredOnly) {
            $sql .= " WHERE is_featured = TRUE";
        }
        
        $sql .= " ORDER BY display_order ASC, created_at DESC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Get destination by ID
     * @param int $id
     * @return array|false
     */
    public function getById(int $id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Check if destination exists
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
     * Create a new destination
     * @param array $data
     * @return int - New destination ID
     */
    public function create(array $data): int {
        // Validate required fields
        $required = ['name', 'duration_hours', 'max_capacity'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("Field '{$field}' is required.");
            }
        }
        
        // Validate duration and capacity
        $duration = (int) $data['duration_hours'];
        $capacity = (int) $data['max_capacity'];
        
        if ($duration <= 0) {
            throw new Exception("Duration must be greater than 0.");
        }
        
        if ($capacity <= 0) {
            throw new Exception("Max capacity must be greater than 0.");
        }
        
        $sql = "INSERT INTO {$this->table} (name, description, duration_hours, max_capacity, image_url, is_featured, display_order) 
                VALUES (:name, :description, :duration_hours, :max_capacity, :image_url, :is_featured, :display_order)";
        
        $this->db->query($sql, [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'duration_hours' => $duration,
            'max_capacity' => $capacity,
            'image_url' => $data['image_url'] ?? null,
            'is_featured' => isset($data['is_featured']) ? (bool)$data['is_featured'] : false,
            'display_order' => isset($data['display_order']) ? (int)$data['display_order'] : 0
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Update a destination
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool {
        if (!$this->exists($id)) {
            throw new Exception("Destination not found.");
        }
        
        // Validate duration and capacity if provided
        if (isset($data['duration_hours'])) {
            $duration = (int) $data['duration_hours'];
            if ($duration <= 0) {
                throw new Exception("Duration must be greater than 0.");
            }
        }
        
        if (isset($data['max_capacity'])) {
            $capacity = (int) $data['max_capacity'];
            if ($capacity <= 0) {
                throw new Exception("Max capacity must be greater than 0.");
            }
        }
        
        // Build update query dynamically
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['name', 'description', 'duration_hours', 'max_capacity', 'image_url', 'is_featured', 'display_order'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                if ($field === 'is_featured') {
                    $params[$field] = (bool)$data[$field];
                } elseif (in_array($field, ['duration_hours', 'max_capacity', 'display_order'])) {
                    $params[$field] = (int)$data[$field];
                } else {
                    $params[$field] = $data[$field] === '' ? null : $data[$field];
                }
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
     * Delete a destination
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        if (!$this->exists($id)) {
            throw new Exception("Destination not found.");
        }
        
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        
        return true;
    }
}

