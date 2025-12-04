<?php
/**
 * Availability Controller
 * Handles availability checking for tours, rentals, and shuttles
 * Returns JSON responses
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Tour.php';

class AvailabilityController extends BaseController {
    private $tour;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->tour = new Tour();
    }
    
    /**
     * Check availability for a service
     * POST /api/availability/check
     */
    public function check(): void {
        try {
            $data = $this->getRequestBody();
            
            // Validate required fields
            if (empty($data['service_type'])) {
                $this->errorResponse('Service type is required', 400);
            }
            
            $serviceType = $data['service_type'];
            
            // For now, only handle tours (Phase 1 MVP)
            if ($serviceType !== 'tours') {
                $this->errorResponse('Only tours availability checking is supported at this time', 400);
            }
            
            // Validate tour-specific fields
            if (empty($data['tour_id'])) {
                $this->errorResponse('Tour ID is required', 400);
            }
            
            if (empty($data['num_guests']) || $data['num_guests'] < 1) {
                $this->errorResponse('Number of guests must be at least 1', 400);
            }
            
            $tourId = (int) $data['tour_id'];
            $numGuests = (int) $data['num_guests'];
            
            // Get tour details
            $tour = $this->tour->getById($tourId);
            
            if (!$tour) {
                $this->errorResponse('Tour not found', 404);
            }
            
            // Check if tour is active
            if ($tour['status'] !== 'active') {
                $this->errorResponse('This tour is not currently available', 400);
            }
            
            // Check availability
            $availableSlots = $this->tour->getAvailableSlots($tourId);
            $hasCapacity = $this->tour->hasCapacity($tourId, $numGuests);
            
            // Calculate total price
            $tourPrice = (float) $tour['price'];
            $totalPrice = $tourPrice * $numGuests;
            
            // Prepare response
            $response = [
                'available' => $hasCapacity,
                'available_slots' => $availableSlots,
                'requested_slots' => $numGuests,
                'total_price' => $totalPrice,
                'tour' => [
                    'id' => $tour['id'],
                    'destination' => $tour['destination'],
                    'description' => $tour['description'],
                    'price' => $tourPrice,
                    'capacity' => (int) $tour['capacity'],
                    'start_date' => $tour['start_date'],
                    'end_date' => $tour['end_date']
                ]
            ];
            
            // Set message based on availability
            if ($hasCapacity) {
                if ($availableSlots <= 3) {
                    $response['message'] = "Limited availability! Only {$availableSlots} slot(s) remaining for this tour.";
                } else {
                    $response['message'] = "Available! {$availableSlots} slot(s) available for this tour.";
                }
            } else {
                $response['message'] = "Not enough capacity. Only {$availableSlots} slot(s) available, but you requested {$numGuests}.";
            }
            
            $this->successResponse($response);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
}

