<?php
require_once __DIR__ . '/../config/db.php';

class AdminMiddleware {    public static function isAdmin() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        error_log("Checking admin status. Session ID: " . session_id());
        error_log("Session data: " . print_r($_SESSION, true));

        if (!isset($_SESSION['user_id'])) {
            error_log("No user_id in session");
            return false;
        }        try {
            $pdo = getDbConnection();
            error_log("DB Connection successful in AdminMiddleware");
            
            $sql = "SELECT is_admin, username FROM users WHERE user_id = ?";
            $stmt = $pdo->prepare($sql);
            error_log("Executing query: " . $sql . " with user_id: " . $_SESSION['user_id']);
            
            if (!$stmt->execute([$_SESSION['user_id']])) {
                error_log("Query execution failed: " . print_r($stmt->errorInfo(), true));
                return false;
            }
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) {
                error_log("No user found with ID: " . $_SESSION['user_id']);
                return false;
            }
            
            error_log("User found: " . print_r($user, true));
            $isAdmin = $user && ($user['is_admin'] === true || $user['is_admin'] === 't' || $user['is_admin'] === '1' || $user['is_admin'] === 1);
            error_log("Admin check result for user {$_SESSION['user_id']} ({$user['username']}): " . ($isAdmin ? "true" : "false"));
            error_log("Raw is_admin value type: " . gettype($user['is_admin']) . ", value: " . print_r($user['is_admin'], true));
            
            return $isAdmin;
        } catch (Exception $e) {
            error_log("Error checking admin status: " . $e->getMessage());
            return false;
        }
    }

    public static function requireAdmin() {
        if (!self::isAdmin()) {
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['error' => 'Admin access required']);
            exit;
        }
    }
}
