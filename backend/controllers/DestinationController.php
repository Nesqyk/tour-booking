<?php
/**
 * Destination Controller
 * Handles HTTP requests for destination resources
 * Returns JSON responses
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Destination.php';
require_once __DIR__ . '/../models/Tour.php';

class DestinationController extends BaseController {
    private $destination;
    private $tour;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->destination = new Destination();
        $this->tour = new Tour();
    }
    
    /**
     * List all destinations
     * GET /api/destinations?featured=true
     */
    public function index(): void {
        try {
            $featuredOnly = isset($_GET['featured']) && $_GET['featured'] === 'true';
            
            $destinations = $this->destination->getAll($featuredOnly);
            
            $this->successResponse(['destinations' => $destinations]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Get single destination
     * GET /api/destinations/{id}
     */
    public function show(): void {
        try {
            $id = $this->requireResourceId();
            
            $destination = $this->destination->getById($id);
            
            if (!$destination) {
                $this->errorResponse('Destination not found', 404);
            }
            
            $this->successResponse($destination);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Create new destination
     * POST /api/destinations
     */
    public function store(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $destinationId = $this->destination->create($data);
            $destination = $this->destination->getById($destinationId);
            
            $this->successResponse($destination, 'Destination created successfully', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Update destination
     * PUT /api/destinations/{id}
     */
    public function update(): void {
        try {
            $id = $this->requireResourceId();
            
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $this->destination->update($id, $data);
            $destination = $this->destination->getById($id);
            
            $this->successResponse($destination, 'Destination updated successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Delete destination
     * DELETE /api/destinations/{id}
     */
    public function destroy(): void {
        try {
            $id = $this->requireResourceId();
            
            $this->destination->delete($id);
            
            $this->successResponse(null, 'Destination deleted successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Get tours for a destination
     * GET /api/destinations/{id}/tours
     */
    public function tours(): void {
        try {
            $id = $this->requireResourceId();
            
            // Get destination by ID to validate it exists and get the name
            $destination = $this->destination->getById($id);
            
            if (!$destination) {
                $this->errorResponse('Destination not found', 404);
                return;
            }
            
            // Get tours matching the destination name
            $tours = $this->tour->getByDestinationName($destination['name']);
            
            // Return tours (empty array is valid - destination exists but has no tours)
            $this->successResponse(['tours' => $tours]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
}

