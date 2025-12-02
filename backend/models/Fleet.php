<?php
/**
 * Fleet Model Class
 * Handles fleet vehicle-related database operations for landing page
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/../config/Database.php';

class Fleet {
    private $db;
    private $table = 'fleet';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all fleet vehicles, optionally filtered by featured
     * @param bool $featuredOnly - If true, only return featured vehicles
     * @return array
     */
    public function getAll(bool $featuredOnly = false): array {
        $sql = "SELECT * FROM {$this->table}";
        
        if ($featuredOnly) {
            $sql .= " WHERE is_featured = TRUE";
        }
        
        $sql .= " ORDER BY display_order ASC, created_at DESC";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll();
        
        // Parse features JSON if present
        foreach ($results as &$result) {
            if (!empty($result['features'])) {
                $decoded = json_decode($result['features'], true);
                $result['features'] = $decoded !== null ? $decoded : explode(',', $result['features']);
            } else {
                $result['features'] = [];
            }
        }
        
        return $results;
    }
    
    /**
     * Get fleet vehicle by ID
     * @param int $id
     * @return array|false
     */
    public function getById(int $id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        $result = $stmt->fetch();
        
        if ($result && !empty($result['features'])) {
            $decoded = json_decode($result['features'], true);
            $result['features'] = $decoded !== null ? $decoded : explode(',', $result['features']);
        } elseif ($result) {
            $result['features'] = [];
        }
        
        return $result;
    }
    
    /**
     * Check if fleet vehicle exists
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
     * Create a new fleet vehicle
     * @param array $data
     * @return int - New vehicle ID
     */
    public function create(array $data): int {
        // Validate required fields
        $required = ['vehicle_type', 'capacity', 'price_per_day'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("Field '{$field}' is required.");
            }
        }
        
        // Validate capacity and price
        $capacity = (int) $data['capacity'];
        $price = (float) $data['price_per_day'];
        
        if ($capacity <= 0) {
            throw new Exception("Capacity must be greater than 0.");
        }
        
        if ($price < 0) {
            throw new Exception("Price cannot be negative.");
        }
        
        // Handle features - convert array to JSON if needed
        $features = null;
        if (isset($data['features'])) {
            if (is_array($data['features'])) {
                $features = json_encode($data['features']);
            } else {
                $features = $data['features'];
            }
        }
        
        $sql = "INSERT INTO {$this->table} (vehicle_type, description, capacity, features, price_per_day, image_url, is_featured, display_order) 
                VALUES (:vehicle_type, :description, :capacity, :features, :price_per_day, :image_url, :is_featured, :display_order)";
        
        $this->db->query($sql, [
            'vehicle_type' => $data['vehicle_type'],
            'description' => $data['description'] ?? null,
            'capacity' => $capacity,
            'features' => $features,
            'price_per_day' => $price,
            'image_url' => $data['image_url'] ?? null,
            'is_featured' => isset($data['is_featured']) ? (bool)$data['is_featured'] : false,
            'display_order' => isset($data['display_order']) ? (int)$data['display_order'] : 0
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Update a fleet vehicle
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool {
        if (!$this->exists($id)) {
            throw new Exception("Fleet vehicle not found.");
        }
        
        // Validate capacity and price if provided
        if (isset($data['capacity'])) {
            $capacity = (int) $data['capacity'];
            if ($capacity <= 0) {
                throw new Exception("Capacity must be greater than 0.");
            }
        }
        
        if (isset($data['price_per_day'])) {
            $price = (float) $data['price_per_day'];
            if ($price < 0) {
                throw new Exception("Price cannot be negative.");
            }
        }
        
        // Handle features - convert array to JSON if needed
        if (isset($data['features'])) {
            if (is_array($data['features'])) {
                $data['features'] = json_encode($data['features']);
            }
        }
        
        // Build update query dynamically
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['vehicle_type', 'description', 'capacity', 'features', 'price_per_day', 'image_url', 'is_featured', 'display_order'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                if ($field === 'is_featured') {
                    $params[$field] = (bool)$data[$field];
                } elseif (in_array($field, ['capacity', 'display_order'])) {
                    $params[$field] = (int)$data[$field];
                } elseif ($field === 'price_per_day') {
                    $params[$field] = (float)$data[$field];
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
     * Delete a fleet vehicle
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        if (!$this->exists($id)) {
            throw new Exception("Fleet vehicle not found.");
        }
        
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        
        return true;
    }
}

