<?php
/**
 * Auth Controller
 * Handles authentication requests (login, register, logout)
 * Returns JSON responses
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Customer.php';

class AuthController extends BaseController {
    private $user;
    private $customer;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->user = new User();
        $this->customer = new Customer();
    }
    
    /**
     * Register new user
     * POST /api/auth/register
     */
    public function register(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            // Validate required fields
            if (!isset($data['email']) || !isset($data['password'])) {
                $this->errorResponse('Email and password are required', 400);
            }
            
            // Set default user_type to customer if not provided
            if (!isset($data['user_type'])) {
                $data['user_type'] = 'customer';
            }
            
            // Only allow customer registration via API (admin must be created manually)
            if ($data['user_type'] === 'admin') {
                $this->errorResponse('Admin accounts cannot be created through registration', 403);
            }
            
            $userId = $this->user->create($data);
            $user = $this->user->getById($userId);
            
            // Auto-create customer record for customer users
            if ($user['user_type'] === 'customer') {
                try {
                    $this->customer->createFromUser($userId, $user['email']);
                } catch (Exception $e) {
                    // Log error but don't fail registration
                    error_log("Failed to create customer record for user {$userId}: " . $e->getMessage());
                }
            }
            
            // Start session
            $this->startSession($user);
            
            $this->successResponse($user, 'Registration successful', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Login user
     * POST /api/auth/login
     */
    public function login(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data) || !isset($data['email']) || !isset($data['password'])) {
                $this->errorResponse('Email and password are required', 400);
            }
            
            $user = $this->user->verifyCredentials($data['email'], $data['password']);
            
            if (!$user) {
                $this->errorResponse('Invalid email or password', 401);
            }
            
            // Auto-create customer record if missing (for customer users)
            if ($user['user_type'] === 'customer') {
                try {
                    $customer = $this->customer->getByUserId($user['id']);
                    if (!$customer) {
                        // Customer record doesn't exist, create it
                        $this->customer->createFromUser($user['id'], $user['email']);
                    }
                } catch (Exception $e) {
                    // Log error but don't fail login
                    error_log("Failed to create/check customer record for user {$user['id']}: " . $e->getMessage());
                }
            }
            
            // Start session
            $this->startSession($user);
            
            $this->successResponse($user, 'Login successful');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Logout user
     * POST /api/auth/logout
     */
    public function logout(): void {
        $this->destroySession();
        $this->successResponse(null, 'Logout successful');
    }
    
    /**
     * Get current user session
     * GET /api/auth/me
     */
    public function me(): void {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            $this->errorResponse('Not authenticated', 401);
        }
        
        $user = $this->user->getById($_SESSION['user_id']);
        
        if (!$user) {
            $this->destroySession();
            $this->errorResponse('User not found', 404);
        }
        
        $this->successResponse($user);
    }
    
    /**
     * Start user session
     * @param array $user
     */
    private function startSession(array $user): void {
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_type'] = $user['user_type'];
    }
    
    /**
     * Destroy user session
     */
    private function destroySession(): void {
        session_start();
        session_unset();
        session_destroy();
    }
}


