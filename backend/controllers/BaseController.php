<?php
/**
 * Base Controller
 * Provides common functionality for all controllers
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/../middleware/AuthMiddleware.php';

abstract class BaseController {
    /**
     * Resource ID from URL path (set by router)
     * @var int|null
     */
    protected $resourceId = null;
    
    /**
     * Set the resource ID from the URL
     * @param int|null $id
     */
    public function setResourceId(?int $id): void {
        $this->resourceId = $id;
    }
    
    /**
     * Get the resource ID
     * @return int|null
     */
    public function getResourceId(): ?int {
        return $this->resourceId;
    }
    
    /**
     * Send JSON response
     * @param mixed $data
     * @param int $statusCode
     */
    protected function jsonResponse($data, int $statusCode = 200): void {
        // Clear any buffered output
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code($statusCode);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Send error response
     * @param string $message
     * @param int $statusCode
     */
    protected function errorResponse(string $message, int $statusCode = 400): void {
        $this->jsonResponse([
            'success' => false,
            'error'   => $message
        ], $statusCode);
    }
    
    /**
     * Send success response
     * @param mixed $data
     * @param string|null $message
     * @param int $statusCode
     */
    protected function successResponse($data = null, ?string $message = null, int $statusCode = 200): void {
        $response = ['success' => true];
        
        if ($message !== null) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        $this->jsonResponse($response, $statusCode);
    }
    
    /**
     * Get JSON request body
     * @return array
     */
    protected function getRequestBody(): array {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->errorResponse('Invalid JSON data', 400);
        }
        
        return $data ?? [];
    }
    
    /**
     * Require a valid resource ID or send error
     * @return int
     */
    protected function requireResourceId(): int {
        if ($this->resourceId === null || $this->resourceId <= 0) {
            $this->errorResponse('Resource ID is required', 400);
        }
        return $this->resourceId;
    }
    
    // =========================================
    // AUTHENTICATION HELPERS
    // =========================================
    
    /**
     * Get current authenticated user
     * @return array|null User data or null if not authenticated
     */
    protected function getCurrentUser(): ?array {
        return AuthMiddleware::getCurrentUser();
    }
    
    /**
     * Require user to be authenticated
     * @throws Exception If not authenticated
     * @return array User data
     */
    protected function requireAuth(): array {
        try {
            return AuthMiddleware::requireAuth();
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 401;
            $this->errorResponse($e->getMessage(), $statusCode);
        }
    }
    
    /**
     * Require user to be a customer
     * @throws Exception If not authenticated or not a customer
     * @return array User data
     */
    protected function requireCustomer(): array {
        try {
            return AuthMiddleware::requireCustomer();
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 403;
            $this->errorResponse($e->getMessage(), $statusCode);
        }
    }
    
    /**
     * Require user to be an admin
     * @throws Exception If not authenticated or not an admin
     * @return array User data
     */
    protected function requireAdmin(): array {
        try {
            return AuthMiddleware::requireAdmin();
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 403;
            $this->errorResponse($e->getMessage(), $statusCode);
        }
    }
    
    /**
     * Get current user's customer record
     * @return array|null Customer data or null if not found
     */
    protected function getCurrentCustomer(): ?array {
        return AuthMiddleware::getCurrentCustomer();
    }
    
    /**
     * Require current user to have a customer record
     * @throws Exception If not authenticated, not a customer, or customer record not found
     * @return array Customer data
     */
    protected function requireCurrentCustomer(): array {
        try {
            return AuthMiddleware::requireCurrentCustomer();
        } catch (Exception $e) {
            $statusCode = $e->getCode() ?: 404;
            $this->errorResponse($e->getMessage(), $statusCode);
        }
    }
    
    /**
     * Check if user is authenticated
     * @return bool
     */
    protected function isAuthenticated(): bool {
        return AuthMiddleware::isAuthenticated();
    }
    
    /**
     * Check if user is customer
     * @return bool
     */
    protected function isCustomer(): bool {
        return AuthMiddleware::isCustomer();
    }
    
    /**
     * Check if user is admin
     * @return bool
     */
    protected function isAdmin(): bool {
        return AuthMiddleware::isAdmin();
    }
}



