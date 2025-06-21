<?php
require_once __DIR__ . '/../config/db.php';

//iau path fara query string
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

//verif daca user e autentificat
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

//rute auth diferite
if (strpos($path, '/api/auth/check-admin') !== false) {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }

    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE user_id = ?");
        $stmt->execute([$_SESSION['user_id']]);
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
    session_destroy();
    echo json_encode(['success' => true]);
}
