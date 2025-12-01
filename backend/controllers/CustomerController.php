<?php
/**
 * Customer Controller
 * Handles HTTP requests for customer resources
 * Returns JSON responses
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Customer.php';

class CustomerController extends BaseController {
    private $customer;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->customer = new Customer();
    }
    
    /**
     * List all customers or search
     * GET /api/customers
     * GET /api/customers?q={query}
     * GET /api/customers?stats=true
     */
    public function index(): void {
        try {
            // Check if this is a search request
            $searchQuery = $_GET['q'] ?? null;
            
            if ($searchQuery !== null) {
                if (strlen($searchQuery) < 2) {
                    $this->errorResponse('Search query must be at least 2 characters', 400);
                }
                
                $customers = $this->customer->search($searchQuery);
                $this->successResponse(['customers' => $customers]);
                return;
            }
            
            // Regular list
            $withBookingCount = isset($_GET['stats']) && $_GET['stats'] === 'true';
            
            $customers = $withBookingCount 
                ? $this->customer->getAllWithBookingCount()
                : $this->customer->getAll();
            
            $this->successResponse(['customers' => $customers]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Get single customer
     * GET /api/customers/{id}
     */
    public function show(): void {
        try {
            $id = $this->requireResourceId();
            
            $customer = $this->customer->getById($id);
            
            if (!$customer) {
                $this->errorResponse('Customer not found', 404);
            }
            
            $this->successResponse($customer);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Create new customer
     * POST /api/customers
     */
    public function store(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $customerId = $this->customer->create($data);
            $customer = $this->customer->getById($customerId);
            
            $this->successResponse($customer, 'Customer created successfully', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Update customer
     * PUT /api/customers/{id}
     */
    public function update(): void {
        try {
            $id = $this->requireResourceId();
            
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $this->customer->update($id, $data);
            $customer = $this->customer->getById($id);
            
            $this->successResponse($customer, 'Customer updated successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Delete customer
     * DELETE /api/customers/{id}
     */
    public function destroy(): void {
        try {
            $id = $this->requireResourceId();
            
            $this->customer->delete($id);
            
            $this->successResponse(null, 'Customer deleted successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
}

