<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ProfileController {
    private $userModel;

    public function __construct($pdo) {
        $this->userModel = new User($pdo);
    }

    public function getProfile() {
        // foloseste AuthMiddleware pt validarea JWT din cookie
        $userData = AuthMiddleware::requireAuth();
        
        $user = $this->userModel->findById($userData->user_id);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        // trimite doar datele de profil
        echo json_encode([
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name'] ?? '',
            'phone' => $user['phone'] ?? ''
        ]);
    }

    public function updateProfile() {
        // foloseste AuthMiddleware pt validarea JWT din cookie
        $userData = AuthMiddleware::requireAuth();

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            return;
        }

        $fullName = trim($data['full_name'] ?? '');
        $username = trim($data['username'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');

        // validare
        if (!$fullName || !$username || !$email) {
            http_response_code(400);
            echo json_encode(['error' => 'Full name, username and email are required']);
            return;
        }        //verif daca emailul exista deja
        $existingUser = $this->userModel->findByEmail($email);
        if ($existingUser && $existingUser['user_id'] != $userData->user_id) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            return;
        }

        // actualizeaza profil
        $updated = $this->userModel->updateProfile($userData->user_id, $fullName, $username, $email, $phone);
        
        if ($updated) {
            http_response_code(200);
            echo json_encode(['message' => 'Profile updated successfully!']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update profile.']);
        }
    }
}