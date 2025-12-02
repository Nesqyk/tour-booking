<?php
/**
 * Check and Initialize Landing Page Tables
 * Checks if tables exist, creates them if missing, and seeds data if empty
 */

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../backend/config/Database.php';

try {
    $db = Database::getInstance();
    $results = [
        'services' => ['exists' => false, 'created' => false, 'seeded' => false],
        'destinations' => ['exists' => false, 'created' => false, 'seeded' => false],
        'fleet' => ['exists' => false, 'created' => false, 'seeded' => false]
    ];
    
    // Check if tables exist and create if missing
    $schemaFile = __DIR__ . '/schema_landing.sql';
    if (file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        // Execute entire schema file
        $statements = explode(';', $schema);
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement) && stripos($statement, 'CREATE TABLE') !== false) {
                try {
                    $db->exec($statement);
                } catch (PDOException $e) {
                    // Table might already exist, ignore
                }
            }
        }
    }
    
    // Check if tables exist now
    $tables = ['services', 'destinations', 'fleet'];
    foreach ($tables as $table) {
        $checkSql = "SHOW TABLES LIKE '{$table}'";
        $stmt = $db->query($checkSql);
        $exists = $stmt->rowCount() > 0;
        $results[$table]['exists'] = $exists;
        
        if ($exists) {
            // Check if table is empty and seed if needed
            $countSql = "SELECT COUNT(*) as count FROM {$table}";
            $countStmt = $db->query($countSql);
            $count = $countStmt->fetch()['count'];
            
            if ($count == 0) {
                // Seed data
                $seedFile = __DIR__ . '/seed_landing.sql';
                if (file_exists($seedFile)) {
                    $seed = file_get_contents($seedFile);
                    // Extract INSERT statements for this table
                    $pattern = '/INSERT INTO\s+' . $table . '.*?;/is';
                    if (preg_match_all($pattern, $seed, $matches)) {
                        foreach ($matches[0] as $insertSql) {
                            try {
                                $db->exec($insertSql);
                                $results[$table]['seeded'] = true;
                            } catch (PDOException $e) {
                                // Ignore duplicate key errors
                            }
                        }
                    }
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Landing page tables checked and initialized',
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

