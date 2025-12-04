<?php
/**
 * Booking Controller
 * Handles HTTP requests for booking resources
 * Returns JSON responses
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Booking.php';

class BookingController extends BaseController {
    private $booking;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->booking = new Booking();
    }
    
    /**
     * List all bookings
     * GET /api/bookings
     */
    public function index(): void {
        try {
            $filters = [
                'status'         => $_GET['status'] ?? null,
                'payment_status' => $_GET['payment_status'] ?? null,
                'tour_id'        => $_GET['tour_id'] ?? null,
                'customer_id'    => $_GET['customer_id'] ?? null,
                'date_from'      => $_GET['date_from'] ?? null,
                'date_to'        => $_GET['date_to'] ?? null,
                'search'         => $_GET['search'] ?? null,
                'sort'           => $_GET['sort'] ?? 'booking_created',
                'order'          => $_GET['order'] ?? 'DESC',
                'limit'          => $_GET['limit'] ?? null,
                'offset'         => $_GET['offset'] ?? 0
            ];
            
            // If user is a customer, auto-filter by their customer_id
            if ($this->isCustomer()) {
                $customer = $this->requireCurrentCustomer();
                $filters['customer_id'] = $customer['id'];
            }
            // Admins can see all bookings, but if they explicitly filter by customer_id, respect it
            
            // Remove null values
            $filters = array_filter($filters, fn($v) => $v !== null);
            
            $bookings = $this->booking->readAll($filters);
            $total = $this->booking->getCount($filters);
            
            $this->successResponse([
                'bookings' => $bookings,
                'total'    => $total,
                'filters'  => $filters
            ]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Get single booking
     * GET /api/bookings/{id}
     */
    public function show(): void {
        try {
            $id = $this->requireResourceId();
            
            $booking = $this->booking->read($id);
            
            if (!$booking) {
                $this->errorResponse('Booking not found', 404);
            }
            
            // Ownership verification for customers
            if ($this->isCustomer()) {
                $customer = $this->requireCurrentCustomer();
                if ($booking['customer_id'] != $customer['id']) {
                    $this->errorResponse('Access denied. You can only view your own bookings.', 403);
                }
            }
            
            $this->successResponse($booking);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Create new booking
     * POST /api/bookings
     */
    public function store(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            // If user is a customer, auto-set customer_id from session
            if ($this->isCustomer()) {
                $customer = $this->requireCurrentCustomer();
                $data['customer_id'] = $customer['id'];
                // Set default status and payment_status for customer bookings
                if (!isset($data['status'])) {
                    $data['status'] = 'pending';
                }
                if (!isset($data['payment_status'])) {
                    $data['payment_status'] = 'unpaid';
                }
            }
            
            // Customers cannot manually set customer_id (security)
            if ($this->isCustomer() && isset($data['customer_id']) && $data['customer_id'] != $this->requireCurrentCustomer()['id']) {
                $this->errorResponse('You cannot create bookings for other customers', 403);
            }
            
            $booking = $this->booking->create($data);
            
            $this->successResponse($booking, 'Booking created successfully', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Update booking
     * PUT /api/bookings/{id}
     */
    public function update(): void {
        try {
            $id = $this->requireResourceId();
            
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            // Get existing booking for ownership check
            $existing = $this->booking->read($id);
            if (!$existing) {
                $this->errorResponse('Booking not found', 404);
            }
            
            // Ownership verification for customers
            if ($this->isCustomer()) {
                $customer = $this->requireCurrentCustomer();
                if ($existing['customer_id'] != $customer['id']) {
                    $this->errorResponse('Access denied. You can only update your own bookings.', 403);
                }
                
                // Customers can only cancel bookings, not confirm them
                if (isset($data['status']) && $data['status'] === 'confirmed') {
                    $this->errorResponse('You cannot confirm bookings. Please contact support.', 403);
                }
                
                // If customer is cancelling, auto-set payment_status to refunded
                if (isset($data['status']) && $data['status'] === 'cancelled') {
                    $data['payment_status'] = 'refunded';
                }
                
                // Customers cannot change customer_id
                if (isset($data['customer_id'])) {
                    unset($data['customer_id']);
                }
            }
            
            $booking = $this->booking->update($id, $data);
            
            $this->successResponse($booking, 'Booking updated successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Delete booking (soft delete)
     * DELETE /api/bookings/{id}
     */
    public function destroy(): void {
        try {
            $id = $this->requireResourceId();
            
            // Get existing booking for ownership check
            $existing = $this->booking->read($id);
            if (!$existing) {
                $this->errorResponse('Booking not found', 404);
            }
            
            // Ownership verification for customers
            if ($this->isCustomer()) {
                $customer = $this->requireCurrentCustomer();
                if ($existing['customer_id'] != $customer['id']) {
                    $this->errorResponse('Access denied. You can only cancel your own bookings.', 403);
                }
                // Customers can only soft delete (cancel), not hard delete
                $hardDelete = false;
            } else {
                $hardDelete = isset($_GET['hard']) && $_GET['hard'] === 'true';
            }
            
            $this->booking->delete($id, $hardDelete);
            
            $message = $hardDelete ? 'Booking permanently deleted' : 'Booking cancelled successfully';
            $this->successResponse(null, $message);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Get dashboard statistics
     * GET /api/bookings/stats
     */
    public function stats(): void {
        try {
            $stats = $this->booking->getDashboardStats();
            $this->successResponse($stats);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
}
