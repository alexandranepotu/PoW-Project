<?php

// Headere pentru CORS și JSON
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

require_once __DIR__ . '/../config/db.php';

// verif daca este o cerere OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $uri = $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    // Log complet pentru debug    error_log("\n=== REQUEST DEBUG INFO ===");
    error_log("REQUEST_URI: " . $_SERVER['REQUEST_URI']);
    error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
    error_log("CONTENT_TYPE: " . $_SERVER['CONTENT_TYPE']);
    error_log("RAW POST DATA: " . file_get_contents('php://input'));
    error_log("PHP_SELF: " . $_SERVER['PHP_SELF']);
    error_log("Raw URI: " . $uri);
    error_log("Raw Method: " . $method);

    $basePath = '/PoW-Project/backend/public';
    $path = parse_url($uri, PHP_URL_PATH);
    
    if (str_starts_with($path, $basePath)) {
        $path = substr($path, strlen($basePath));
    }

    error_log("Path after replace: " . $path);

    // ruta pentru register
    if ($path === '/api/register' && $method === 'POST') {
        require_once __DIR__ . '/../controllers/AuthController.php';
        $controller = new AuthController($pdo);
        $controller->register();
        exit;
    }

    // ruta pentru login
    if ($path === '/api/login' && $method === 'POST') {
    try {
        require_once __DIR__ . '/../controllers/AuthController.php';
        $controller = new AuthController($pdo);
        $controller->login();
        return;
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
        return;
    }
    }

    // ruta pentru logout
    if ($path === '/api/logout' && $method === 'POST') {
        try {
            require_once __DIR__ . '/../controllers/AuthController.php';
            $controller = new AuthController($pdo);
            $controller->logout();
            return;
        } catch (Exception $e) {
            error_log("Logout error: " . $e->getMessage());
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
            return;
        }
    }

    if ($path === '/api/profile' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/ProfileController.php';
        $controller = new ProfileController($pdo);
        $controller->getProfile();
        exit;
    }

    if ($path === '/api/profile/update' && $method === 'POST') {
        require_once __DIR__ . '/../controllers/ProfileController.php';
        $controller = new ProfileController($pdo);
        $controller->updateProfile();
        exit;
    }

    // ruta pentru pets
    if (str_starts_with($path, '/api/pets')) {
        require_once __DIR__ . '/../controllers/PetController.php';
        $controller = new PetController($pdo);
        
        if ($path === '/api/pets/my' && $method === 'GET') {
            $controller->getMyPets();
            exit;
        }
        
        if ($path === '/api/pets' && $method === 'POST') {
            $controller->addPet();
            exit;
        }
    }

    // daca nicio ruta nu se potriveste
    http_response_code(404);
    echo json_encode(['error' => 'Route not found: ' . $path]);
    exit;

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
    exit;
}
?>