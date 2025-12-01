<?php
/**
 * PHP Execution Test
 * Access this file directly to verify PHP is working
 */

header('Content-Type: application/json; charset=UTF-8');

$response = [
    'success' => true,
    'message' => 'PHP is executing correctly!',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_ini_loaded' => php_ini_loaded_file(),
    'php_ini_scanned' => php_ini_scanned_files(),
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'loaded_extensions' => get_loaded_extensions()
];

// Test database connection
try {
    require_once __DIR__ . '/../config/Database.php';
    $db = Database::getInstance();
    $response['database'] = [
        'connected' => true,
        'message' => 'Database connection successful'
    ];
} catch (Exception $e) {
    $response['database'] = [
        'connected' => false,
        'error' => $e->getMessage()
    ];
    // Get the original PDO error if available
    $response['database']['pdo_error'] = $e->getPrevious() ? $e->getPrevious()->getMessage() : 'No previous exception';
}

echo json_encode($response, JSON_PRETTY_PRINT);