<?php
//start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

//debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); //nu se afis in browser
ini_set('log_errors', 1); //se logheaza

//headere pentru CORS și JSON
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

//extrage path-ul cererii
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
error_log("Processing request for path: " . $requestPath);

//verif rutele de admin
if (strpos($requestPath, '/api/admin/') !== false) {
    error_log("Routing to admin.php");
    require_once __DIR__ . '/admin.php';
    exit;
}
//verif rutele de chat
else if (strpos($requestPath, '/api/chat/') !== false) {
    error_log("Chat request detected - Full request details:");
    error_log("Original path: " . $requestPath);
    error_log("HTTP Method: " . $_SERVER['REQUEST_METHOD']);
    error_log("Query string: " . $_SERVER['QUERY_STRING']);
    
    //include ruta chat
    require_once __DIR__ . '/chat.php';
    exit;
}
//verif rutele auth
else if (strpos($requestPath, '/api/auth/') !== false) {
    error_log("Routing to auth.php");
    require_once __DIR__ . '/auth.php';
    exit;
}

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
    error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);    error_log("CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set'));
    error_log("RAW POST DATA: " . file_get_contents('php://input'));
    error_log("PHP_SELF: " . $_SERVER['PHP_SELF']);
    error_log("Raw URI: " . $uri);
    error_log("Raw Method: " . $method);    $path = parse_url($uri, PHP_URL_PATH);
    
    //incearca alte path uri de baza
    $possibleBasePaths = [
        '/PoW-Project/backend/public',
        '/PoW-Project',
        ''
    ];
    
    foreach ($possibleBasePaths as $basePath) {
        if (str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath));
            break;
        }
    }
      error_log("Path after replace: " . $path);
    error_log("Checking if path matches admin routes: " . (str_starts_with($path, '/api/admin') ? 'yes' : 'no'));

    //rute admin
    if (str_starts_with($path, '/api/admin')) {
        require_once __DIR__ . '/../routes/admin.php';
        exit;
    }

    //verif status admin
    if ($path === '/api/auth/check-admin' && $method === 'GET') {
        require_once __DIR__ . '/../middleware/AdminMiddleware.php';
        echo json_encode(['isAdmin' => AdminMiddleware::isAdmin()]);
        exit;
    }

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
    }    //map api -> obtine locatiile tuturor utilizatorilor
    if ($path === '/api/users/locations' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/MapController.php';
        $controller = new MapController($pdo);
        $controller->getUsersLocations();
        exit;
    }    // map api -> obtine locatia curenta a utilizatorului
    if ($path === '/api/user/location' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/MapController.php';
        $controller = new MapController($pdo);
        $controller->getCurrentUserLocation();
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

    // ruta pentru news feed
    if (($path === '/news' || $path === '/index.php/news') && $method === 'GET') {
        require_once __DIR__ . '/../controllers/NewsController.php';
        $controller = new NewsController();
        $controller->getNews();
        exit;
    }    // === Auth & Admin Routes ===
    // These should be checked first
    
    // Check admin status
    if ($path === '/api/auth/check-admin' && $method === 'GET') {
        require_once __DIR__ . '/../middleware/AdminMiddleware.php';
        header('Content-Type: application/json');
        $isAdmin = AdminMiddleware::isAdmin();
        error_log("Admin check result: " . ($isAdmin ? "true" : "false"));
        echo json_encode(['isAdmin' => $isAdmin]);
        exit;
    }    // Admin routes
    if (strpos($path, '/api/admin/') === 0) {
        error_log("\n=== Admin Route Processing ===");
        error_log("Raw path: " . $path);
        error_log("Method: " . $method);
        error_log("Request URI: " . $_SERVER['REQUEST_URI']);
        
        require_once __DIR__ . '/../middleware/AdminMiddleware.php';
        
        // Check admin status before processing admin routes
        if (!AdminMiddleware::isAdmin()) {
            error_log("Admin access denied");
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        error_log("Admin access granted, including admin routes");
        
        // Remove base path if present
        $cleanPath = preg_replace('#^(/PoW-Project/backend/public)?(/index\.php)?#', '', $path);
        error_log("Clean path for admin routing: " . $cleanPath);
        
        // Set these for admin.php
        $path = $cleanPath;
        
        require_once __DIR__ . '/admin.php';
        exit;
    }

    // Applications routes
    require_once __DIR__ . '/applications.php';

    // If no route matched
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
