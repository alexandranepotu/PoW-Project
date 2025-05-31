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
    
        $data = json_decode(file_get_contents('php://input'), true);

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
    }
}

// Pornire controller
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $auth = new AuthController($pdo);
    $auth->register();
}
?>
