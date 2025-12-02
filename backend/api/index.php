<?php
/**
 * REST API Router
 * Entry point for all API requests
 * Routes requests to appropriate controllers based on URL and HTTP method
 * 
 * Rufbac Tour System (RTS) Dashboard
 */

// Start output buffering to catch any errors before headers
ob_start();

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set content type to JSON FIRST (before any output)
header('Content-Type: application/json; charset=UTF-8');

// CORS headers for frontend communication
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // 24 hours cache for preflight

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

/**
 * Send error response
 */
function sendErrorResponse(string $message, int $statusCode = 400, array $debug = []): void {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($statusCode);
    $response = [
        'success' => false,
        'error'   => $message
    ];
    if (!empty($debug)) {
        $response['debug'] = $debug;
    }
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// =========================================
// PARSE REQUEST
// =========================================

$method = $_SERVER['REQUEST_METHOD'];

// Get the route from the query string (set by .htaccess)
$route = $_GET['_route'] ?? '';
unset($_GET['_route']); // Remove from GET params

// Parse the route: /resource or /resource/id or /resource/action
$segments = array_filter(explode('/', trim($route, '/')));
$segments = array_values($segments); // Re-index

$resource = $segments[0] ?? null;
$resourceId = null;
$action = null;

// Determine if second segment is an ID (numeric) or an action (string like "stats")
if (isset($segments[1])) {
    if (is_numeric($segments[1])) {
        $resourceId = (int) $segments[1];
        // Check for action after ID (e.g., /bookings/1/cancel)
        $action = $segments[2] ?? null;
    } else {
        // It's an action like "stats"
        $action = $segments[1];
    }
}

// =========================================
// ROUTE DEFINITIONS
// =========================================

// Map resources to controllers
$controllerMap = [
    'bookings'     => 'BookingController',
    'tours'        => 'TourController',
    'customers'    => 'CustomerController',
    'services'     => 'ServiceController',
    'destinations' => 'DestinationController',
    'fleet'        => 'FleetController',
    'auth'         => 'AuthController'
];

// REST method to controller method mapping
// index = list all, show = get one, store = create, update = update, destroy = delete
$restMethodMap = [
    'GET' => [
        'collection' => 'index',    // GET /resource
        'item'       => 'show'      // GET /resource/{id}
    ],
    'POST' => [
        'collection' => 'store',    // POST /resource
        'item'       => null        // POST /resource/{id} - not typically used
    ],
    'PUT' => [
        'collection' => null,       // PUT /resource - not typically used
        'item'       => 'update'    // PUT /resource/{id}
    ],
    'DELETE' => [
        'collection' => null,       // DELETE /resource - not typically used
        'item'       => 'destroy'   // DELETE /resource/{id}
    ]
];

// Custom action routes (beyond standard REST)
$customActions = [
    'bookings' => [
        'stats' => ['method' => 'GET', 'handler' => 'stats']
    ],
    'auth' => [
        'register' => ['method' => 'POST', 'handler' => 'register'],
        'login' => ['method' => 'POST', 'handler' => 'login'],
        'logout' => ['method' => 'POST', 'handler' => 'logout'],
        'me' => ['method' => 'GET', 'handler' => 'me']
    ]
];

// =========================================
// ROUTE REQUEST
// =========================================

// Validate resource
if (!$resource) {
    sendErrorResponse('API endpoint required. Available: /api/bookings, /api/tours, /api/customers, /api/services, /api/destinations, /api/fleet, /api/auth', 400);
}

if (!isset($controllerMap[$resource])) {
    sendErrorResponse("Unknown resource: {$resource}. Available: bookings, tours, customers, services, destinations, fleet, auth", 404);
}

// Load the controller
$controllerName = $controllerMap[$resource];
$controllerPath = __DIR__ . "/../controllers/{$controllerName}.php";

if (!file_exists($controllerPath)) {
    sendErrorResponse("Controller not found: {$controllerName}", 500);
}

try {
    require_once $controllerPath;
    $controller = new $controllerName();
    
    // Set resource ID if provided
    if ($resourceId !== null) {
        $controller->setResourceId($resourceId);
    }
} catch (Throwable $e) {
    sendErrorResponse('Failed to initialize controller: ' . $e->getMessage(), 500, [
        'type' => get_class($e),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

// Determine which method to call
$controllerMethod = null;

// Check for custom action first
if ($action !== null && isset($customActions[$resource][$action])) {
    $customAction = $customActions[$resource][$action];
    if ($customAction['method'] !== $method) {
        sendErrorResponse("Action '{$action}' requires {$customAction['method']} method", 405);
    }
    $controllerMethod = $customAction['handler'];
} else if ($action !== null) {
    // Unknown action
    sendErrorResponse("Unknown action: {$action}", 404);
} else {
    // Standard REST routing
    $routeType = $resourceId !== null ? 'item' : 'collection';
    
    if (!isset($restMethodMap[$method])) {
        sendErrorResponse('Method not allowed', 405);
    }
    
    $controllerMethod = $restMethodMap[$method][$routeType];
    
    if ($controllerMethod === null) {
        sendErrorResponse("{$method} is not allowed on this endpoint", 405);
    }
}

// Check if controller has the method
if (!method_exists($controller, $controllerMethod)) {
    sendErrorResponse("Method not implemented: {$controllerMethod}", 501);
}

// =========================================
// EXECUTE REQUEST
// =========================================

try {
    $controller->$controllerMethod();
} catch (Throwable $e) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    error_log("API Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An unexpected error occurred: ' . $e->getMessage(),
        'debug' => [
            'type' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => explode("\n", $e->getTraceAsString())
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}
