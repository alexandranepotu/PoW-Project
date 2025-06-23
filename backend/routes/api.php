<?php

//headere pentru CORS și JSON
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
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
    error_log("\n\n=== NEW REQUEST STARTED ===");
    $uri = $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    error_log("REQUEST_URI: " . $_SERVER['REQUEST_URI']);
    error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
    error_log("SCRIPT_NAME: " . $_SERVER['SCRIPT_NAME']);
    error_log("SCRIPT_FILENAME: " . $_SERVER['SCRIPT_FILENAME']);
    error_log("CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set'));
    error_log("RAW POST DATA: " . file_get_contents('php://input'));
    error_log("PHP_SELF: " . $_SERVER['PHP_SELF']);
    error_log("Raw URI: " . $uri);
    error_log("Raw Method: " . $method);    $path = parse_url($uri, PHP_URL_PATH);
    error_log("Original path: " . $path);
    
    // base path uri potentiale
    $possibleBasePaths = [
        '/PoW-Project/backend/public',
        '/PoW-Project/backend',
        '/backend/public',
        '/backend'
    ];
    
    error_log("Checking base paths:");
      foreach ($possibleBasePaths as $basePath) {
        error_log("Checking if path starts with: " . $basePath);
        if (str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath));
            error_log("Match found! Path after removing " . $basePath . ": " . $path);
            break;
        }
    }

    error_log("Final processed path: " . $path);
      //rute rss
    if ($path === '/api/rss/test' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/RssController.php';
        $controller = new RssController();
        error_log("RSS Feed - Test route matched");
        $controller->test();
        exit;
    }
      //verif ruta rss
    error_log("Checking RSS feed route match...");
    error_log("Current path: " . $path);
    error_log("Current method: " . $method);
    error_log("RSS controller file path: " . __DIR__ . '/../controllers/RssController.php');
    
    if (($path === '/api/rss/feed' || $path === '/rss/feed') && $method === 'GET') {
        error_log("RSS Feed route matched!");
        $controllerFile = __DIR__ . '/../controllers/RssController.php';
        
        if (!file_exists($controllerFile)) {
            error_log("ERROR: RssController.php not found at: " . $controllerFile);
            http_response_code(500);
            echo "RSS Controller not found";
            exit;
        }
        
        require_once $controllerFile;
        error_log("RssController.php included successfully");
        
        $controller = new RssController();
        error_log("RSS Feed - Feed route matched, generating feed");
        $controller->generateFeed();
        exit;
    } else {
        error_log("RSS Feed route NOT matched");
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
            return;        }
    }

    // ruta pentru verificare status admin
    if ($path === '/api/auth/check-admin' && $method === 'GET') {
        try {
            require_once __DIR__ . '/../controllers/AuthController.php';
            $controller = new AuthController($pdo);
            $controller->checkAdminStatus();
            return;
        } catch (Exception $e) {
            error_log("Check admin status error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
            return;
        }
    }

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
    }    //ruta pentru animale (adopt)
    if ($path === '/api/animals' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/PetPageController.php';
    $controller = new PetPageController();
    $controller->handleRequest();
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
            echo json_encode(['error' => 'Method not allowed']);        }        
            exit;        }     // ruta pentru news
    if ($path === '/api/news' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/NewsController.php';
        $controller = new NewsController();
        $controller->getNews();
        exit;
    }
    
    // ruta pentru adaugare news (admin only)
    if ($path === '/api/news' && $method === 'POST') {
        require_once __DIR__ . '/../controllers/NewsController.php';
        $controller = new NewsController();
        $controller->addNews();
        exit;
    }
    
    // ruta pentru stergere news (admin only)
    if (preg_match('/^\/api\/news\/(\d+)$/', $path, $matches) && $method === 'DELETE') {
        require_once __DIR__ . '/../controllers/NewsController.php';
        $controller = new NewsController();
        $controller->deleteNews($matches[1]);
        exit;
    }

    // ruta pentru news (fara api prefix)
    if ($path === '/news' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/NewsController.php';
        $controller = new NewsController();
        $controller->getNews();
        exit;
    }

    // ruta pentru chat
    if (str_starts_with($path, '/api/chat')) {
        require_once __DIR__ . '/chat.php';
        exit;
    }

    // rute pentru admin
    if (str_starts_with($path, '/api/admin')) {
        require_once __DIR__ . '/../controllers/AdminController.php';
        $controller = new AdminController($pdo);
        
        if ($path === '/api/admin/users' && $method === 'GET') {
            $controller->getAllUsers();
            return;
        }
        
        if (preg_match('#^/api/admin/users/(\d+)$#', $path, $matches) && $method === 'DELETE') {
            $userId = $matches[1];
            $controller->deleteUser($userId);
            return;
        }
          if (preg_match('#^/api/admin/users/(\d+)/toggle-admin$#', $path, $matches) && $method === 'POST') {
            $userId = $matches[1];
            $data = json_decode(file_get_contents('php://input'), true);
            $isAdmin = $data['is_admin'] ?? false;
            $controller->toggleUserAdmin($userId, $isAdmin);
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
        $controller->updateProfile();        exit;    }    // RSS Feed route
    if ($path === '/api/rss/feed' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/RssController.php';
        $controller = new RssController();
        $controller->generateFeed();
        exit;
    }

    // RSS Filtered Feed route
    if ($path === '/api/rss/filtered' && $method === 'GET') {
        require_once __DIR__ . '/../controllers/RssController.php';
        $controller = new RssController();
        $controller->generateFilteredFeed();
        exit;
    }

    // Applications routes
    if (str_starts_with($path, '/api/applications')) {
        require_once __DIR__ . '/../controllers/AdoptionApplicationController.php';
        $controller = new AdoptionApplicationController($pdo);
        
        // GET /api/applications/submitted?user_id=123
        if ($path === '/api/applications/submitted' && $method === 'GET') {
            $applicant_id = $_GET['user_id'] ?? null;
            if ($applicant_id) {
                $controller->getSubmittedApplications($applicant_id);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Missing user_id']);
            }
            exit;
        }
        
        // GET /api/applications/received?user_id=123
        if ($path === '/api/applications/received' && $method === 'GET') {
            $owner_id = $_GET['user_id'] ?? null;
            if ($owner_id) {
                $controller->getReceivedApplications($owner_id);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Missing user_id']);
            }
            exit;
        }
        
        // GET /api/applications/{id}
        if (preg_match('#^/api/applications/(\d+)$#', $path, $matches) && $method === 'GET') {
            $controller->getApplicationById($matches[1]);
            exit;
        }
        
        // POST /api/applications/{id}/status
        if (preg_match('#^/api/applications/(\d+)/status$#', $path, $matches) && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $status = $data['status'] ?? null;
            $response_message = $data['response_message'] ?? null;
            $controller->updateApplicationStatus($matches[1], $status, $response_message);
            exit;
        }
        
        // POST /api/applications (submit new application)
        if ($path === '/api/applications' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $controller->submitApplication($data);
            exit;
        }
    }

    } catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
    exit;
    }
    ?>
