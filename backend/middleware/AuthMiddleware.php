<?php
/**
 * Authentication Middleware
 * Centralized authentication and authorization checks
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Customer.php';

class AuthMiddleware {
    private static $userModel = null;
    private static $customerModel = null;
    
    /**
     * Initialize models (lazy loading)
     */
    private static function initModels(): void {
        if (self::$userModel === null) {
            self::$userModel = new User();
        }
        if (self::$customerModel === null) {
            self::$customerModel = new Customer();
        }
    }
    
    /**
     * Get current authenticated user from session
     * @return array|null User data or null if not authenticated
     */
    public static function getCurrentUser(): ?array {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        
        self::initModels();
        $user = self::$userModel->getById($_SESSION['user_id']);
        
        if (!$user) {
            // Session has invalid user_id, destroy session
            self::destroySession();
            return null;
        }
        
        return $user;
    }
    
    /**
     * Require user to be authenticated
     * @throws Exception If not authenticated
     * @return array User data
     */
    public static function requireAuth(): array {
        $user = self::getCurrentUser();
        
        if (!$user) {
            throw new Exception('Authentication required', 401);
        }
        
        return $user;
    }
    
    /**
     * Require user to be a customer
     * @throws Exception If not authenticated or not a customer
     * @return array User data
     */
    public static function requireCustomer(): array {
        $user = self::requireAuth();
        
        if ($user['user_type'] !== 'customer') {
            throw new Exception('Access denied. Customer access required.', 403);
        }
        
        return $user;
    }
    
    /**
     * Require user to be an admin
     * @throws Exception If not authenticated or not an admin
     * @return array User data
     */
    public static function requireAdmin(): array {
        $user = self::requireAuth();
        
        if ($user['user_type'] !== 'admin') {
            throw new Exception('Access denied. Admin access required.', 403);
        }
        
        return $user;
    }
    
    /**
     * Get customer record by user ID
     * @param int $userId
     * @return array|null Customer data or null if not found
     */
    public static function getCustomerByUserId(int $userId): ?array {
        self::initModels();
        return self::$customerModel->getByUserId($userId);
    }
    
    /**
     * Get current user's customer record
     * @return array|null Customer data or null if not found
     */
    public static function getCurrentCustomer(): ?array {
        $user = self::getCurrentUser();
        
        if (!$user || $user['user_type'] !== 'customer') {
            return null;
        }
        
        return self::getCustomerByUserId($user['id']);
    }
    
    /**
     * Require current user to have a customer record
     * @throws Exception If not authenticated, not a customer, or customer record not found
     * @return array Customer data
     */
    public static function requireCurrentCustomer(): array {
        $user = self::requireCustomer();
        $customer = self::getCustomerByUserId($user['id']);
        
        if (!$customer) {
            throw new Exception('Customer profile not found. Please contact support.', 404);
        }
        
        return $customer;
    }
    
    /**
     * Destroy user session
     */
    public static function destroySession(): void {
        session_start();
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
    }
    
    /**
     * Check if user is authenticated
     * @return bool
     */
    public static function isAuthenticated(): bool {
        return self::getCurrentUser() !== null;
    }
    
    /**
     * Check if user is customer
     * @return bool
     */
    public static function isCustomer(): bool {
        $user = self::getCurrentUser();
        return $user !== null && $user['user_type'] === 'customer';
    }
    
    /**
     * Check if user is admin
     * @return bool
     */
    public static function isAdmin(): bool {
        $user = self::getCurrentUser();
        return $user !== null && $user['user_type'] === 'admin';
    }
}

