<?php
/**
 * Service Controller
 * Handles HTTP requests for service resources
 * Returns JSON responses
 * 
 * Ruf Bac Tour Services
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Service.php';

class ServiceController extends BaseController {
    private $service;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->service = new Service();
    }
    
    /**
     * List all services
     * GET /api/services?type={rental|tour|shuttle}
     */
    public function index(): void {
        try {
            $type = $_GET['type'] ?? null;
            
            if ($type !== null && !in_array($type, ['rental', 'tour', 'shuttle'])) {
                $this->errorResponse('Invalid service type. Must be: rental, tour, or shuttle', 400);
            }
            
            $services = $this->service->getAll($type);
            
            $this->successResponse(['services' => $services]);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Get single service
     * GET /api/services/{id}
     */
    public function show(): void {
        try {
            $id = $this->requireResourceId();
            
            $service = $this->service->getById($id);
            
            if (!$service) {
                $this->errorResponse('Service not found', 404);
            }
            
            $this->successResponse($service);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * Create new service
     * POST /api/services
     */
    public function store(): void {
        try {
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $serviceId = $this->service->create($data);
            $service = $this->service->getById($serviceId);
            
            $this->successResponse($service, 'Service created successfully', 201);
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Update service
     * PUT /api/services/{id}
     */
    public function update(): void {
        try {
            $id = $this->requireResourceId();
            
            $data = $this->getRequestBody();
            
            if (empty($data)) {
                $this->errorResponse('No data provided', 400);
            }
            
            $this->service->update($id, $data);
            $service = $this->service->getById($id);
            
            $this->successResponse($service, 'Service updated successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Delete service
     * DELETE /api/services/{id}
     */
    public function destroy(): void {
        try {
            $id = $this->requireResourceId();
            
            $this->service->delete($id);
            
            $this->successResponse(null, 'Service deleted successfully');
            
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage(), 400);
        }
    }
}

