<?php
//incarc modelul User si conexiunea la baza de date
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../config/db.php';

class AuthController {
    private $userModel; //fol pt operatii cu utilizatori

    //constructor->primeste conexiunea PDO si creeeaza un obj user
    public function __construct($pdo) {
        $this->userModel = new User($pdo);
    }

      // asteapta date POST JSON 
      //extrageaza datele si le valideaza
    public function register() {
        // Log request data
        error_log('Register request received: ' . file_get_contents('php://input'));

        $data = json_decode(file_get_contents('php://input'), true);
        
        // Log decoded data
        error_log('Decoded data: ' . print_r($data, true));

        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            return;
        }

        $fullName = trim($data['full_name'] ?? '');
        $username = trim($data['username'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $password = $data['password'] ?? '';

        // validare simpla, eroare->404 bad request
        // daca lipseste vreun camp, returneaza eroare
        if (!$fullName || !$username || !$email || !$phone || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            return;
        }

        // verifica daca exista emailul deja->findbyemail din user
        if ($this->userModel->findByEmail($email)) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            return;
        }

        // creeaza user nou
        $created = $this->userModel->create($fullName, $username, $email, $phone, $password);
        if ($created) {
            http_response_code(201);
            echo json_encode(['message' => 'User registered successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to register user']);
        }
    }    public function login() {
        try {
            error_log("\n=== Login attempt started ===");
            
            // Citim datele de intrare
            $inputData = file_get_contents('php://input');
            error_log("Raw input data: " . $inputData);
            
            if (empty($inputData)) {
                http_response_code(400);
                echo json_encode(['error' => 'No input data received']);
                return;
            }
            
            // decdodare json + verificare erori
            $data = json_decode($inputData, true);
            if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON format']);
                return;
            }
            
            // validare campuri
            if (!isset($data['username']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Username and password are required']);
                return;
            }

            $username = trim($data['username']);
            $password = $data['password'];

            // verificare daca username si parola nu sunt goale
            if (empty($username) || empty($password)) {
                http_response_code(400);
                echo json_encode(['error' => 'Username and password cannot be empty']);
                return;
            }

            // autentificare
            $loginResult = $this->userModel->login($username, $password);
            
            if (!$loginResult['success']) {
                http_response_code(401);
                echo json_encode(['error' => $loginResult['message']]);
                return;
            }

            // succes!!!!
            $_SESSION['user_id'] = $loginResult['user']['id'];
            $_SESSION['username'] = $loginResult['user']['username'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => $loginResult['user']
            ]);
            return;

        } catch (Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Server error occurred']);
            return;
        }
    }
}

// Pornire controller
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $auth = new AuthController($pdo);

    $path = $_SERVER['REQUEST_URI'];

    if (strpos($path, 'register') !== false) {
        $auth->register();
        exit;
    } elseif (strpos($path, 'login') !== false) {
        session_start(); 
        $auth->login();
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Unknown action']);
        exit;
    }
}

?>
