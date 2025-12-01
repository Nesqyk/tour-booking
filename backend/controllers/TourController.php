<?php
/**
 * Tour Controller
 * Handles HTTP requests for tour resources
 * Returns JSON responses
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Tour.php';

class TourController extends BaseController {
    private $tour;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->tour = new Tour();
    }
    
    /**
     * List all tours
     * GET /api/tours
     */
    public function index(): void {
        try {
            $includeInactive = isset($_GET['all']) && $_GET['all'] === 'true';
            
            $tours = $includeInactive 
                ? $this->tour->getAllIncludingInactive()
                : $this->tour->getAll();
            
            $this->successResponse(['tours' => $tours]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Get single tour
     * GET /api/tours/{id}
     */
    public function show(): void {
        try {
            $id = $this->requireResourceId();
            
            $tour = $this->tour->getById($id);
            
            if (!$tour) {
                $this->errorResponse('Tour not found', 404);
            }
            
            // Add available slots
            $tour['available_slots'] = $this->tour->getAvailableSlots($id);
            
            $this->successResponse($tour);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Create new tour
     * POST /api/tours
     */
    public function store(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $tourId = $this->tour->create($data);
            $tour = $this->tour->getById($tourId);
            
            $this->successResponse($tour, 'Tour created successfully', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Update tour
     * PUT /api/tours/{id}
     */
    public function update(): void {
        try {
            $id = $this->requireResourceId();
            
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $this->tour->update($id, $data);
            $tour = $this->tour->getById($id);
            
            $this->successResponse($tour, 'Tour updated successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Delete tour
     * DELETE /api/tours/{id}
     */
    public function destroy(): void {
        try {
            $id = $this->requireResourceId();
            
            $this->tour->delete($id);
            
            $this->successResponse(null, 'Tour deleted successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
}

