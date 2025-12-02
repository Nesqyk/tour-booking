<?php
/**
 * Fleet Controller
 * Handles HTTP requests for fleet vehicle resources
 * Returns JSON responses
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Fleet.php';

class FleetController extends BaseController {
    private $fleet;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->fleet = new Fleet();
    }
    
    /**
     * List all fleet vehicles
     * GET /api/fleet?featured=true
     */
    public function index(): void {
        try {
            $featuredOnly = isset($_GET['featured']) && $_GET['featured'] === 'true';
            
            $fleet = $this->fleet->getAll($featuredOnly);
            
            $this->successResponse(['fleet' => $fleet]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Get single fleet vehicle
     * GET /api/fleet/{id}
     */
    public function show(): void {
        try {
            $id = $this->requireResourceId();
            
            $vehicle = $this->fleet->getById($id);
            
            if (!$vehicle) {
                $this->errorResponse('Fleet vehicle not found', 404);
            }
            
            $this->successResponse($vehicle);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Create new fleet vehicle
     * POST /api/fleet
     */
    public function store(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $fleetId = $this->fleet->create($data);
            $vehicle = $this->fleet->getById($fleetId);
            
            $this->successResponse($vehicle, 'Fleet vehicle created successfully', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Update fleet vehicle
     * PUT /api/fleet/{id}
     */
    public function update(): void {
        try {
            $id = $this->requireResourceId();
            
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $this->fleet->update($id, $data);
            $vehicle = $this->fleet->getById($id);
            
            $this->successResponse($vehicle, 'Fleet vehicle updated successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Delete fleet vehicle
     * DELETE /api/fleet/{id}
     */
    public function destroy(): void {
        try {
            $id = $this->requireResourceId();
            
            $this->fleet->delete($id);
            
            $this->successResponse(null, 'Fleet vehicle deleted successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
}

