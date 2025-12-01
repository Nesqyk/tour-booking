<?php
/**
 * Base Controller
 * Provides common functionality for all controllers
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

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
}

