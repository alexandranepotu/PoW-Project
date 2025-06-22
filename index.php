<?php
$isAuthenticated = false;

// Verifica autentificarea prin JWT token din cookie
if (isset($_COOKIE['auth_token'])) {
    require_once __DIR__ . '/backend/models/JwtManager.php';
    try {
        $payload = JwtManager::validateToken($_COOKIE['auth_token']);
        if ($payload && isset($payload->user_id)) {
            $isAuthenticated = true;
        }
    } catch (Exception $e) {
        // Token invalid sau expirat
        error_log('JWT validation failed in index.php: ' . $e->getMessage());
    }
}

if ($isAuthenticated) {
    header('Location: frontend/views/dashboard.html');
} else {
    header('Location: frontend/views/login.html');
}
exit;
?>
