<?php
session_start();

$isAuthenticated = false;

if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
    $isAuthenticated = true;
}

if (!$isAuthenticated && isset($_COOKIE['jwt_token'])) {
    require_once __DIR__ . '/backend/models/JwtManager.php';
    try {
        $jwtManager = new JwtManager();
        $payload = $jwtManager->validateToken($_COOKIE['jwt_token']);
        if ($payload && isset($payload['user_id'])) {
            $isAuthenticated = true;
            $_SESSION['user_id'] = $payload['user_id'];
        }
    } catch (Exception $e) {
    }
}

if ($isAuthenticated) {
    header('Location: frontend/views/dashboard.html');
} else {
    header('Location: frontend/views/login.html');
}
exit;
?>
