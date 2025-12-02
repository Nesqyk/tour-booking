<?php
/**
 * Check and Initialize Authentication Tables
 * Checks if users table exists, creates it if missing, and seeds data if empty
 */

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../backend/config/Database.php';

try {
    $db = Database::getInstance();
    $results = [
        'users' => ['exists' => false, 'created' => false, 'seeded' => false]
    ];
    
    // Check if users table exists and create if missing
    $schemaFile = __DIR__ . '/schema_auth.sql';
    if (file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        // Execute entire schema file
        $statements = explode(';', $schema);
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement) && stripos($statement, 'CREATE TABLE') !== false) {
                try {
                    $db->exec($statement);
                    $results['users']['created'] = true;
                } catch (PDOException $e) {
                    // Table might already exist, ignore
                }
            }
        }
    }
    
    // Check if users table exists now
    $checkSql = "SHOW TABLES LIKE 'users'";
    $stmt = $db->query($checkSql);
    $exists = $stmt->rowCount() > 0;
    $results['users']['exists'] = $exists;
    
    if ($exists) {
        // Check if table is empty and seed if needed
        $countSql = "SELECT COUNT(*) as count FROM users";
        $countStmt = $db->query($countSql);
        $count = $countStmt->fetch()['count'];
        
        if ($count == 0) {
            // Seed data
            $seedFile = __DIR__ . '/seed_auth.sql';
            if (file_exists($seedFile)) {
                $seed = file_get_contents($seedFile);
                // Extract INSERT statements
                $pattern = '/INSERT INTO\s+users.*?;/is';
                if (preg_match_all($pattern, $seed, $matches)) {
                    foreach ($matches[0] as $insertSql) {
                        try {
                            $db->exec($insertSql);
                            $results['users']['seeded'] = true;
                        } catch (PDOException $e) {
                            // Ignore duplicate key errors
                        }
                    }
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Authentication tables checked and initialized',
        'results' => $results
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}

