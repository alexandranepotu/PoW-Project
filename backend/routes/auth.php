<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/JwtManager.php';

//iau path fara query string
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

//verif daca user e autentificat prin JWT
function isLoggedIn() {
    if (!isset($_COOKIE['auth_token'])) {
        return false;
    }
    try {
        $decoded = JwtManager::validateToken($_COOKIE['auth_token']);
        return $decoded !== null;
    } catch (Exception $e) {
        return false;
    }
}

//functie pentru a obtine user ID din JWT
function getCurrentUserId() {
    if (!isset($_COOKIE['auth_token'])) {
        return null;
    }
    try {
        $decoded = JwtManager::validateToken($_COOKIE['auth_token']);
        return $decoded ? $decoded->user_id : null;
    } catch (Exception $e) {
        return null;
    }
}

//rute auth diferite
if (strpos($path, '/api/auth/check-admin') !== false) {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    try {
        $userId = getCurrentUserId();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid token']);
            exit;
        }

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user && $user['is_admin']) {
            echo json_encode(['success' => true, 'isAdmin' => true]);
        } else {
            echo json_encode(['success' => true, 'isAdmin' => false]);
        }
    } catch (Exception $e) {
        error_log("Error in check-admin: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server error']);
    }
} else if (strpos($path, '/api/auth/logout') !== false && $method === 'POST') {
    // Sterge cookie-ul JWT
    setcookie('auth_token', '', time() - 3600, '/');
    echo json_encode(['success' => true]);
}
