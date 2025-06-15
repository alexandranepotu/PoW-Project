<?php
require_once __DIR__ . '/../models/JwtManager.php';

class AuthMiddleware {
    
    public static function requireAuth() {
        // verif daca JWT-ul este setat in cookie
        // si daca nu este, returneaza 401 Unauthorized
        if (!isset($_COOKIE['auth_token'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit; //opreste executia daca nu e autentificat
        }

        try {
            // valideaza tokenul folosind JwtManager
            $userData = JwtManager::validateToken($_COOKIE['auth_token']);
            
            if (!$userData) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid or expired token']);
                exit;
            }
            
            //returneaza datele utilizatorului autentificat
            return $userData;
            
        } catch (Exception $e) {
            error_log('Auth middleware error: ' . $e->getMessage());
            http_response_code(401);
            echo json_encode(['error' => 'Authentication failed']);
            exit;
        }
    }
    
    public static function getAuthenticatedUser() {
        // versiune fara verificare a statusului HTTP
        // doar returneaza datele utilizatorului daca JWT-ul este valid
        if (!isset($_COOKIE['auth_token'])) {
            return null;
        }

        try {
            return JwtManager::validateToken($_COOKIE['auth_token']);
        } catch (Exception $e) {
            error_log('Auth middleware error: ' . $e->getMessage());
            return null;
        }
    }
}
?>