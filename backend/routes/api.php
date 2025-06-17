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
        $controller->updateProfile();        exit;    }

    // rute pentru pets (dashboard general si My Pets)
    if (str_starts_with($path, '/api/pets')) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        
        if ($path === '/api/pets' && $method === 'GET') {
            $controller->getAllPets(); // Pentru dashboard general
            exit;
        }
        
        if ($path === '/api/pets/my' && $method === 'GET') {
            $controller->getMyPets(); // Pentru My Pets (backward compatibility)
            exit;
        }
        
        if ($path === '/api/pets' && $method === 'POST') {
            $controller->addPet();
            exit;
        }
    }

    // rute pentru adrese
    if (str_starts_with($path, '/api/address')) {
        require_once __DIR__ . '/../controllers/AddressController.php';
        $controller = new AddressController();
        
        if ($path === '/api/address' && $method === 'GET') {
            $controller->getAddress();
            exit;
        }
        
        if ($path === '/api/address/update' && $method === 'POST') {
            $controller->updateAddress();
            exit;
        }
        
        if ($path === '/api/address' && $method === 'DELETE') {
            $controller->deleteAddress();
            exit;
        }
    }    // rute pentru My Pets
    if (preg_match('#^/api/mypets$#', $path)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        
        if ($method === 'GET') {
            $controller->getMyPets();
        } elseif ($method === 'POST') {
            $controller->addPet();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    // Detalii animal specific
    if (preg_match('#^/api/mypets/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $petId = $matches[1];
        
        if ($method === 'GET') {
            $controller->getPetDetails($petId);
        } elseif ($method === 'PUT') {
            $controller->updatePet($petId);
        } elseif ($method === 'DELETE') {
            $controller->deletePet($petId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    // add feeding record
    if (preg_match('#^/api/mypets/(\d+)/feeding$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $petId = $matches[1];
        
        if ($method === 'POST') {
            $controller->addFeedingRecord($petId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    // add medical record
    if (preg_match('#^/api/mypets/(\d+)/medical$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $petId = $matches[1];
        
        if ($method === 'POST') {
            $controller->addMedicalRecord($petId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    // Upload media
    if (preg_match('#^/api/mypets/(\d+)/media$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $petId = $matches[1];
        
        if ($method === 'POST') {
            $controller->uploadMedia($petId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    // sterge feedings record
    if (preg_match('#^/api/mypets/feeding/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $feedId = $matches[1];
        
        if ($method === 'DELETE') {
            $controller->deleteFeedingRecord($feedId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    // sterge medical record
    if (preg_match('#^/api/mypets/medical/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $recordId = $matches[1];
        
        if ($method === 'DELETE') {
            $controller->deleteMedicalRecord($recordId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }
    
    //sterge media
    if (preg_match('#^/api/mypets/media/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $mediaId = $matches[1];
        
        if ($method === 'DELETE') {
            $controller->deleteMedia($mediaId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }

    //ruta pentru animale (adopt)
    if ($path === '/api/animals' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/PetPageController.php';
    $controller = new AnimalController();
    $controller->getAnimals();
    exit;
    }

    // actualizare pickup address cu adresa utilizatorului
    if (preg_match('#^/api/mypets/(\d+)/pickup-address$#', $path, $matches)) {        require_once __DIR__ . '/../controllers/MyPetsController.php';
        $controller = new MyPetsController();
        $petId = $matches[1];
        
        if ($method === 'PUT') {
            $controller->updatePickupAddress($petId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);        }        exit;
        }

    //daca nicio ruta nu se potriveste
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
