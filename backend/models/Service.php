<?php
/**
 * Service Model Class
 * Handles service-related database operations for landing page
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/../config/Database.php';

class Service {
    private $db;
    private $table = 'services';
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all services, optionally filtered by type
     * @param string|null $type - 'rental', 'tour', or 'shuttle'
     * @return array
     */
    public function getAll(?string $type = null): array {
        $sql = "SELECT * FROM {$this->table} WHERE is_active = TRUE";
        
        if ($type !== null) {
            $sql .= " AND service_type = :type";
            $params = ['type' => $type];
        } else {
            $params = [];
        }
        
        $sql .= " ORDER BY display_order ASC, created_at DESC";
        
        $stmt = $this->db->query($sql, $params);
        $results = $stmt->fetchAll();
        
        // Parse benefits JSON if present
        foreach ($results as &$result) {
            if (!empty($result['benefits'])) {
                $decoded = json_decode($result['benefits'], true);
                $result['benefits'] = $decoded !== null ? $decoded : explode(',', $result['benefits']);
            } else {
                $result['benefits'] = [];
            }
        }
        
        return $results;
    }
    
    /**
     * Get service by ID
     * @param int $id
     * @return array|false
     */
    public function getById(int $id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        $result = $stmt->fetch();
        
        if ($result && !empty($result['benefits'])) {
            $decoded = json_decode($result['benefits'], true);
            $result['benefits'] = $decoded !== null ? $decoded : explode(',', $result['benefits']);
        } elseif ($result) {
            $result['benefits'] = [];
        }
        
        return $result;
    }
    
    /**
     * Get services by type
     * @param string $type - 'rental', 'tour', or 'shuttle'
     * @return array
     */
    public function getByType(string $type): array {
        return $this->getAll($type);
    }
    
    /**
     * Check if service exists
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
     * Create a new service
     * @param array $data
     * @return int - New service ID
     */
    public function create(array $data): int {
        // Validate required fields
        $required = ['service_type', 'name'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("Field '{$field}' is required.");
            }
        }
        
        // Validate service_type
        $validTypes = ['rental', 'tour', 'shuttle'];
        if (!in_array($data['service_type'], $validTypes)) {
            throw new Exception("Invalid service_type. Must be one of: " . implode(', ', $validTypes));
        }
        
        // Handle benefits - convert array to JSON if needed
        $benefits = null;
        if (isset($data['benefits'])) {
            if (is_array($data['benefits'])) {
                $benefits = json_encode($data['benefits']);
            } else {
                $benefits = $data['benefits'];
            }
        }
        
        $sql = "INSERT INTO {$this->table} (service_type, name, description, icon_class, benefits, image_url, is_active, display_order) 
                VALUES (:service_type, :name, :description, :icon_class, :benefits, :image_url, :is_active, :display_order)";
        
        $this->db->query($sql, [
            'service_type' => $data['service_type'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'icon_class' => $data['icon_class'] ?? null,
            'benefits' => $benefits,
            'image_url' => $data['image_url'] ?? null,
            'is_active' => isset($data['is_active']) ? (bool)$data['is_active'] : true,
            'display_order' => isset($data['display_order']) ? (int)$data['display_order'] : 0
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Update a service
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool {
        if (!$this->exists($id)) {
            throw new Exception("Service not found.");
        }
        
        // Validate service_type if provided
        if (isset($data['service_type'])) {
            $validTypes = ['rental', 'tour', 'shuttle'];
            if (!in_array($data['service_type'], $validTypes)) {
                throw new Exception("Invalid service_type. Must be one of: " . implode(', ', $validTypes));
            }
        }
        
        // Handle benefits - convert array to JSON if needed
        if (isset($data['benefits'])) {
            if (is_array($data['benefits'])) {
                $data['benefits'] = json_encode($data['benefits']);
            }
        }
        
        // Build update query dynamically
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['service_type', 'name', 'description', 'icon_class', 'benefits', 'image_url', 'is_active', 'display_order'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                if ($field === 'is_active') {
                    $params[$field] = (bool)$data[$field];
                } elseif ($field === 'display_order') {
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
     * Delete a service (soft delete by default)
     * @param int $id
     * @param bool $hardDelete - If true, permanently delete
     * @return bool
     */
    public function delete(int $id, bool $hardDelete = false): bool {
        if (!$this->exists($id)) {
            throw new Exception("Service not found.");
        }
        
        if ($hardDelete) {
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $this->db->query($sql, ['id' => $id]);
        } else {
            // Soft delete
            $sql = "UPDATE {$this->table} SET is_active = FALSE WHERE id = :id";
            $this->db->query($sql, ['id' => $id]);
        }
        
        return true;
    }
}

