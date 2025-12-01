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
            $hardDelete = isset($_GET['hard']) && $_GET['hard'] === 'true';
            
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
