/**
 * RTS Dashboard - API Service Module
 * Handles all asynchronous communication with the PHP backend
 * Uses RESTful API conventions
 */

const API = (() => {
    // Debug mode - set to true for development logging
    const DEBUG = true;
    
    // Base URL for API endpoints - relative path for subdirectory compatibility
    const getBasePath = () => {
        const path = window.location.pathname;
        // Find the project root (where index.html lives)
        const lastSlash = path.lastIndexOf('/');
        return lastSlash > 0 ? path.substring(0, lastSlash) : '';
    };
    
    const BASE_PATH = getBasePath();
    const API_BASE = `${BASE_PATH}/api`;
    
    /**
     * Custom API Error class to preserve full error context
     */
    class APIError extends Error {
        constructor(message, statusCode = 0, response = null, debug = null) {
            super(message);
            this.name = 'APIError';
            this.statusCode = statusCode;
            this.response = response;
            this.debug = debug;
        }
    }
    
    /**
     * Debug logger - only logs when DEBUG is true
     */
    function debugLog(...args) {
        if (DEBUG) {
            console.log('[API Debug]', ...args);
        }
    }
    
    /**
     * Debug error logger - only logs when DEBUG is true
     */
    function debugError(...args) {
        if (DEBUG) {
            console.error('[API Error]', ...args);
        }
    }
    
    /**
     * Build URL with optional query parameters
     * @param {string} endpoint - API endpoint path
     * @param {Object} params - Query parameters
     * @returns {string} Full URL
     */
    function buildUrl(endpoint, params = {}) {
        const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });
        
        return url.toString();
    }
    
    /**
     * Generic fetch wrapper with error handling
     * @param {string} endpoint - API endpoint (e.g., '/bookings', '/bookings/1')
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - JSON response
     */
    async function request(endpoint, options = {}) {
        const { method = 'GET', body = null, params = {} } = options;
        
        const url = buildUrl(endpoint, params);
        
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (body && (method === 'POST' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }
        
        try {
            debugLog('Request:', method, url);
            
            const response = await fetch(url, fetchOptions);
            
            debugLog('Response Status:', response.status);
            debugLog('Response Headers:', response.headers.get('content-type'));
            
            const contentType = response.headers.get('content-type') || '';
            
            let data;
            let responseText = '';
            
            try {
                const responseClone = response.clone();
                
                try {
                    data = await response.json();
                    debugLog('Response Data:', data);
                } catch (jsonError) {
                    responseText = await responseClone.text();
                    debugError('JSON Parse Error:', jsonError.message);
                    debugError('Response Text Preview:', responseText.substring(0, 200));
                    
                    if (!contentType.includes('json')) {
                        throw new APIError(
                            `Server returned ${contentType || 'unknown content type'} instead of JSON.`,
                            response.status,
                            { text: responseText.substring(0, 500) }
                        );
                    }
                    
                    throw new APIError(
                        `Invalid JSON response: ${responseText.substring(0, 200)}`,
                        response.status,
                        { text: responseText.substring(0, 500) }
                    );
                }
            } catch (error) {
                if (error instanceof APIError) {
                    throw error;
                }
                throw new APIError(
                    `Failed to parse response: ${error.message}`,
                    response.status
                );
            }
            
            if (!response.ok || data.success === false) {
                throw new APIError(
                    data.error || `HTTP error: ${response.status}`,
                    response.status,
                    data,
                    data.debug || null
                );
            }
            
            return data;
            
        } catch (error) {
            if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
                throw new APIError(
                    'Network error. Please check your connection and that Apache/PHP is running.',
                    0,
                    null,
                    { originalError: error.message }
                );
            }
            
            if (error instanceof APIError) {
                throw error;
            }
            
            throw new APIError(
                error.message || 'An unexpected error occurred',
                0,
                null,
                { originalError: error.toString() }
            );
        }
    }
    
    // =========================================
    // BOOKING ENDPOINTS
    // =========================================
    
    /**
     * Fetch all bookings with optional filters
     * GET /api/bookings
     */
    async function fetchBookings(filters = {}) {
        return request('/bookings', { params: filters });
    }
    
    /**
     * Fetch a single booking by ID
     * GET /api/bookings/{id}
     */
    async function fetchBooking(id) {
        return request(`/bookings/${id}`);
    }
    
    /**
     * Create a new booking
     * POST /api/bookings
     */
    async function createBooking(data) {
        return request('/bookings', { method: 'POST', body: data });
    }
    
    /**
     * Update an existing booking
     * PUT /api/bookings/{id}
     */
    async function updateBooking(id, data) {
        return request(`/bookings/${id}`, { method: 'PUT', body: data });
    }
    
    /**
     * Delete (cancel) a booking
     * DELETE /api/bookings/{id}
     */
    async function deleteBooking(id, hardDelete = false) {
        return request(`/bookings/${id}`, { 
            method: 'DELETE', 
            params: { hard: hardDelete ? 'true' : 'false' } 
        });
    }
    
    // =========================================
    // DASHBOARD ENDPOINTS
    // =========================================
    
    /**
     * Fetch dashboard statistics
     * GET /api/bookings/stats
     */
    async function fetchDashboardStats() {
        return request('/bookings/stats');
    }
    
    // =========================================
    // TOUR ENDPOINTS
    // =========================================
    
    /**
     * Fetch all tours
     * GET /api/tours
     */
    async function fetchTours(includeInactive = false) {
        return request('/tours', { 
            params: { all: includeInactive ? 'true' : 'false' } 
        });
    }
    
    /**
     * Fetch a single tour by ID
     * GET /api/tours/{id}
     */
    async function fetchTour(id) {
        return request(`/tours/${id}`);
    }
    
    /**
     * Create a new tour
     * POST /api/tours
     */
    async function createTour(data) {
        return request('/tours', { method: 'POST', body: data });
    }
    
    /**
     * Update a tour
     * PUT /api/tours/{id}
     */
    async function updateTour(id, data) {
        return request(`/tours/${id}`, { method: 'PUT', body: data });
    }
    
    /**
     * Delete a tour
     * DELETE /api/tours/{id}
     */
    async function deleteTour(id) {
        return request(`/tours/${id}`, { method: 'DELETE' });
    }
    
    // =========================================
    // CUSTOMER ENDPOINTS
    // =========================================
    
    /**
     * Fetch all customers
     * GET /api/customers
     */
    async function fetchCustomers(withStats = false) {
        return request('/customers', { 
            params: { stats: withStats ? 'true' : 'false' } 
        });
    }
    
    /**
     * Fetch a single customer by ID
     * GET /api/customers/{id}
     */
    async function fetchCustomer(id) {
        return request(`/customers/${id}`);
    }
    
    /**
     * Create a new customer
     * POST /api/customers
     */
    async function createCustomer(data) {
        return request('/customers', { method: 'POST', body: data });
    }
    
    /**
     * Update a customer
     * PUT /api/customers/{id}
     */
    async function updateCustomer(id, data) {
        return request(`/customers/${id}`, { method: 'PUT', body: data });
    }
    
    /**
     * Delete a customer
     * DELETE /api/customers/{id}
     */
    async function deleteCustomer(id) {
        return request(`/customers/${id}`, { method: 'DELETE' });
    }
    
    /**
     * Search customers by name or email
     * GET /api/customers?q={query}
     */
    async function searchCustomers(query) {
        return request('/customers', { params: { q: query } });
    }
    
    // =========================================
    // SERVICE ENDPOINTS
    // =========================================
    
    /**
     * Fetch all services, optionally filtered by type
     * GET /api/services?type={rental|tour|shuttle}
     */
    async function fetchServices(type = null) {
        const params = type ? { type } : {};
        return request('/services', { params });
    }
    
    /**
     * Fetch a single service by ID
     * GET /api/services/{id}
     */
    async function fetchService(id) {
        return request(`/services/${id}`);
    }
    
    /**
     * Create a new service
     * POST /api/services
     */
    async function createService(data) {
        return request('/services', { method: 'POST', body: data });
    }
    
    /**
     * Update a service
     * PUT /api/services/{id}
     */
    async function updateService(id, data) {
        return request(`/services/${id}`, { method: 'PUT', body: data });
    }
    
    /**
     * Delete a service
     * DELETE /api/services/{id}
     */
    async function deleteService(id) {
        return request(`/services/${id}`, { method: 'DELETE' });
    }
    
    // =========================================
    // DESTINATION ENDPOINTS
    // =========================================
    
    /**
     * Fetch all destinations, optionally filtered by featured
     * GET /api/destinations?featured=true
     */
    async function fetchDestinations(featuredOnly = false) {
        const params = featuredOnly ? { featured: 'true' } : {};
        return request('/destinations', { params });
    }
    
    /**
     * Fetch a single destination by ID
     * GET /api/destinations/{id}
     */
    async function fetchDestination(id) {
        return request(`/destinations/${id}`);
    }
    
    /**
     * Create a new destination
     * POST /api/destinations
     */
    async function createDestination(data) {
        return request('/destinations', { method: 'POST', body: data });
    }
    
    /**
     * Update a destination
     * PUT /api/destinations/{id}
     */
    async function updateDestination(id, data) {
        return request(`/destinations/${id}`, { method: 'PUT', body: data });
    }
    
    /**
     * Delete a destination
     * DELETE /api/destinations/{id}
     */
    async function deleteDestination(id) {
        return request(`/destinations/${id}`, { method: 'DELETE' });
    }
    
    // =========================================
    // FLEET ENDPOINTS
    // =========================================
    
    /**
     * Fetch all fleet vehicles, optionally filtered by featured
     * GET /api/fleet?featured=true
     */
    async function fetchFleet(featuredOnly = false) {
        const params = featuredOnly ? { featured: 'true' } : {};
        return request('/fleet', { params });
    }
    
    /**
     * Fetch a single fleet vehicle by ID
     * GET /api/fleet/{id}
     */
    async function fetchFleetVehicle(id) {
        return request(`/fleet/${id}`);
    }
    
    /**
     * Create a new fleet vehicle
     * POST /api/fleet
     */
    async function createFleet(data) {
        return request('/fleet', { method: 'POST', body: data });
    }
    
    /**
     * Update a fleet vehicle
     * PUT /api/fleet/{id}
     */
    async function updateFleet(id, data) {
        return request(`/fleet/${id}`, { method: 'PUT', body: data });
    }
    
    /**
     * Delete a fleet vehicle
     * DELETE /api/fleet/{id}
     */
    async function deleteFleet(id) {
        return request(`/fleet/${id}`, { method: 'DELETE' });
    }
    
    // =========================================
    // IMAGE UPLOAD
    // =========================================
    
    /**
     * Upload an image file
     * POST /api/upload.php
     * @param {File} file - File object from input
     * @param {string} type - 'services', 'destinations', or 'fleet'
     * @returns {Promise<Object>} Response with image path
     */
    async function uploadImage(file, type) {
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file provided');
        }
        
        if (!['services', 'destinations', 'fleet'].includes(type)) {
            throw new Error('Invalid type. Must be: services, destinations, or fleet');
        }
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);
        
        const url = `${BASE_PATH}/api/upload.php`;
        
        try {
            debugLog('Uploading image:', file.name, 'to', type);
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            debugLog('Upload Response Status:', response.status);
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new APIError(
                    result.error || 'Upload failed',
                    response.status,
                    result
                );
            }
            
            debugLog('Upload successful:', result);
            return result;
            
        } catch (error) {
            debugError('Upload error:', error);
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError('Upload failed: ' + error.message, 0, null, error);
        }
    }
    
    // =========================================
    // AUTHENTICATION ENDPOINTS
    // =========================================
    
    /**
     * Register a new user
     * POST /api/auth/register
     */
    async function register(data) {
        return request('/auth/register', { method: 'POST', body: data });
    }
    
    /**
     * Login user
     * POST /api/auth/login
     */
    async function login(data) {
        return request('/auth/login', { method: 'POST', body: data });
    }
    
    /**
     * Logout user
     * POST /api/auth/logout
     */
    async function logout() {
        return request('/auth/logout', { method: 'POST' });
    }
    
    /**
     * Get current user
     * GET /api/auth/me
     */
    async function getCurrentUser() {
        return request('/auth/me');
    }
    
    // =========================================
    // PUBLIC API
    // =========================================
    
    return {
        // Error class for external use
        APIError,
        
        // Bookings
        fetchBookings,
        fetchBooking,
        createBooking,
        updateBooking,
        deleteBooking,
        
        // Dashboard
        fetchDashboardStats,
        
        // Tours
        fetchTours,
        fetchTour,
        createTour,
        updateTour,
        deleteTour,
        
        // Customers
        fetchCustomers,
        fetchCustomer,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        searchCustomers,
        
        // Services
        fetchServices,
        fetchService,
        createService,
        updateService,
        deleteService,
        
        // Destinations
        fetchDestinations,
        fetchDestination,
        createDestination,
        updateDestination,
        deleteDestination,
        
        // Fleet
        fetchFleet,
        fetchFleetVehicle,
        createFleet,
        updateFleet,
        deleteFleet,
        
        // Image Upload
        uploadImage,
        
        // Authentication
        register,
        login,
        logout,
        getCurrentUser
    };
})();
