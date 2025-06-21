<?php
//debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';

//iau metoda si path-ul din request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

ob_start(); //buffer output
//debugging admin
error_log("Admin route debug - Path: " . $path);
error_log("Admin route debug - Method: " . $method);
error_log("Admin route debug - Full URI: " . $_SERVER['REQUEST_URI']);

//verif status admin
if (!AdminMiddleware::isAdmin()) {
    error_log("Admin access denied in admin.php");
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$pdo = getDbConnection();

$adminController = new AdminController($pdo);

//rute admin
error_log("\n=== Admin Route Handler ===");
error_log("Processing path: " . $path);
error_log("Method: " . $method);

//normalizez path ul
$path = rtrim($path ?? '', '/');
$path = preg_replace('#^/index\.php#', '', $path);
$path = preg_replace('#^/PoW-Project/backend/public#', '', $path); // Remove the base path
error_log("Normalized path: " . $path);

if ($method === 'GET') {
    error_log("Processing GET request for path: " . $path);
      //verif endpoint la lista useri
    if (strpos($path, '/api/admin/users') !== false) {
        error_log("Matched users list route");
        ob_clean(); //sterg alte outputuri
        header('Content-Type: application/json');
        $adminController->getAllUsers();
        ob_end_flush();
        exit;
    }
    
    error_log("No matching GET route found");
}

if ($method === 'DELETE' && preg_match('#/api/admin/users/(\d+)#', $path, $matches)) {
    $userId = $matches[1];
    error_log("Attempting to delete user ID: " . $userId);
    try {
        $adminController->deleteUser($userId);
        exit;
    } catch (Exception $e) {
        error_log("Failed to delete user: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]);
        exit;
    }
}
