<?php
/**
 * Image Upload Handler
 * Handles file uploads for services, destinations, and fleet
 * 
 * Ruf Bac Tour Services
 */

header('Content-Type: application/json; charset=UTF-8');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

try {
    // Validate file upload
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error occurred.');
    }
    
    // Get upload type (services, destinations, fleet)
    $type = $_POST['type'] ?? null;
    if (!$type || !in_array($type, ['services', 'destinations', 'fleet'])) {
        throw new Exception('Invalid type. Must be: services, destinations, or fleet.');
    }
    
    $file = $_FILES['image'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type. Allowed types: JPG, PNG, WEBP.');
    }
    
    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if ($file['size'] > $maxSize) {
        throw new Exception('File size exceeds maximum of 5MB.');
    }
    
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../assets/images/' . $type . '/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create upload directory.');
        }
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_', true) . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save uploaded file.');
    }
    
    // Return relative path for database storage
    $relativePath = 'assets/images/' . $type . '/' . $filename;
    
    echo json_encode([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'data' => [
            'path' => $relativePath,
            'url' => '/' . $relativePath, // For use in img src
            'filename' => $filename
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

