<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/JwtManager.php';

class AdminMiddleware {
    
    public static function isAdmin() {
        try {
            // Verifica JWT token din cookie
            if (!isset($_COOKIE['auth_token'])) {
                error_log("No JWT token found in cookies");
                return false;
            }

            // Valideaza tokenul JWT
            $decoded = JwtManager::validateToken($_COOKIE['auth_token']);
            
            if ($decoded === null) {
                error_log("Invalid or expired JWT token");
                return false;
            }

            $userId = $decoded->user_id;
            error_log("Checking admin status for user ID from JWT: " . $userId);

            // Verifica statusul de admin din baza de date
            $pdo = getDbConnection();
            error_log("DB Connection successful in AdminMiddleware");
            
            $sql = "SELECT is_admin, username FROM users WHERE user_id = ?";
            $stmt = $pdo->prepare($sql);
            error_log("Executing query: " . $sql . " with user_id: " . $userId);
            
            if (!$stmt->execute([$userId])) {
                error_log("Query execution failed: " . print_r($stmt->errorInfo(), true));
                return false;
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) {
                error_log("No user found with ID: " . $userId);
                return false;
            }
            
            error_log("User found: " . print_r($user, true));
            $isAdmin = $user && ($user['is_admin'] === true || $user['is_admin'] === 't' || $user['is_admin'] === '1' || $user['is_admin'] === 1);
            error_log("Admin check result for user {$userId} ({$user['username']}): " . ($isAdmin ? "true" : "false"));
            error_log("Raw is_admin value type: " . gettype($user['is_admin']) . ", value: " . print_r($user['is_admin'], true));
            
            return $isAdmin;
        } catch (Exception $e) {
            error_log("Error checking admin status: " . $e->getMessage());
            return false;
        }
    }    public function checkAdmin() {
        return self::isAdmin();
    }

    public static function requireAdmin() {
        if (!self::isAdmin()) {
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['error' => 'Admin access required']);
            exit;
        }
    }
}
