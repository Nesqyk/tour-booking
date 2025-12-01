<?php
/**
 * Database Connection Class
 * Singleton pattern for MySQL connection via PDO
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

class Database {
    // Database credentials
    private $host = 'localhost';
    private $db_name = 'rufbac_tours';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    
    // PDO connection instance
    private $conn = null;
    
    // Singleton instance
    private static $instance = null;
    
    /**
     * Private constructor - prevents direct instantiation
     */
    private function __construct() {
        $this->connect();
    }
    
    /**
     * Get singleton instance
     * @return Database
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Establish database connection
     */
    private function connect(): void {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch (PDOException $e) {
            // Log error and throw generic exception
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed. Please try again later.");
        }
    }
    
    /**
     * Get PDO connection
     * @return PDO
     */
    public function getConnection(): PDO {
        return $this->conn;
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction(): bool {
        return $this->conn->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit(): bool {
        return $this->conn->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback(): bool {
        return $this->conn->rollBack();
    }
    
    /**
     * Get last insert ID
     * @return string
     */
    public function lastInsertId(): string {
        return $this->conn->lastInsertId();
    }
    
    /**
     * Prepare and execute a query
     * @param string $sql
     * @param array $params
     * @return PDOStatement
     */
    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

