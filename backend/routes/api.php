<?php
//porneste sesiunea ->pt a gestiona starea intre cereri
session_start();

// Headere pentru CORS(cross-origin->comunicare front-back) și JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

$uri = $_SERVER['REQUEST_URI'];    // Obtine URI-ul cererii
$method = $_SERVER['REQUEST_METHOD'];

// Log pentru debug
error_log("URI received: " . $uri);
error_log("Method: " . $method);

$path = parse_url($uri, PHP_URL_PATH);
$path = str_replace('/PoW-Project/backend/public', '', $path);

error_log("Path after replace: " . $path);

//rutarea
if ($path === '/api/register' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    $controller = new AuthController($pdo);
    $controller->register();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Route not found: ' . $path]);
?>