<?php
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../config/db.php';

class AdminController {
    private $pdo;    public function __construct($pdo = null) {
        error_log("AdminController constructor - PDO provided: " . ($pdo !== null ? 'yes' : 'no'));
        if ($pdo === null) {
            try {
                error_log("AdminController constructor - Getting new DB connection");
                $this->pdo = getDbConnection();
                error_log("AdminController constructor - New DB connection successful");
            } catch (Exception $e) {
                error_log("AdminController constructor - Database connection failed: " . $e->getMessage());
                throw new Exception("Failed to connect to database");
            }
        } else {
            error_log("AdminController constructor - Using provided PDO connection");
            $this->pdo = $pdo;
        }
    }    public function getAllUsers() {
        error_log("\n=== AdminController::getAllUsers - Starting ===");
        
        // Clear any previous output
        if (ob_get_level()) ob_end_clean();
        
        try {
            if (!isset($_SESSION['user_id'])) {
                throw new Exception("No user session found");
            }
            error_log("Session user_id: " . $_SESSION['user_id']);
            
            AdminMiddleware::requireAdmin();
            error_log("Admin check passed successfully");
            
            // Set headers
            header('Content-Type: application/json');
            header("Cache-Control: no-cache, no-store, must-revalidate");
            
            error_log("Preparing to execute users query");
            $sql = "SELECT 
                    u.user_id,
                    u.username,
                    u.email,
                    u.full_name,
                    u.created_at,
                    u.phone,
                    u.is_admin::boolean,
                    COUNT(DISTINCT a.animal_id) as total_pets,
                    (
                        SELECT COUNT(DISTINCT app.application_id)
                        FROM adoption_applications app
                        WHERE app.applicant_id = u.user_id
                        AND app.status = 'accepted'
                    ) as adoptions_made,
                    (
                        SELECT COUNT(DISTINCT app.application_id)
                        FROM adoption_applications app
                        JOIN animals an ON app.pet_id = an.animal_id
                        WHERE an.added_by = u.user_id
                        AND app.status = 'accepted'
                    ) as pets_adopted
                FROM users u
                LEFT JOIN animals a ON u.user_id = a.added_by
                WHERE u.is_admin = 'f'
                GROUP BY u.user_id, u.username, u.email, u.full_name, u.created_at, u.phone, u.is_admin
                ORDER BY u.created_at DESC
            ";
            error_log("AdminController::getAllUsers - Executing query: " . $sql);            error_log("Executing SQL query...");
            try {
                $stmt = $this->pdo->query($sql);
                if (!$stmt) {
                    $error = $this->pdo->errorInfo();
                    error_log("Query failed: " . print_r($error, true));
                    throw new Exception("Database query failed: " . $error[2]);
                }
                
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Query successful - Found " . count($users) . " users");
                
                $response = ['success' => true, 'users' => $users];
                $jsonResponse = json_encode($response);
                
                if ($jsonResponse === false) {
                    throw new Exception("Failed to encode JSON: " . json_last_error_msg());
                }
                
                error_log("Sending response: " . $jsonResponse);
                echo $jsonResponse;
                exit;
            } catch (PDOException $e) {
                error_log("Database error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Database error occurred']);
                exit;
            }
        } catch (Exception $e) {
            error_log("Error fetching users: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch users']);
        }
    }    public function deleteUser($userId) {
        header('Content-Type: application/json');
        error_log("\n=== Starting user deletion process ===");
        error_log("User ID: " . $userId);

        try {
            AdminMiddleware::requireAdmin();
            
            //verif daca id ul la user e valid
            if (!is_numeric($userId) || $userId <= 0) {
                throw new Exception("Invalid user ID provided");
            }
            
            $this->pdo->beginTransaction();
            
            //verif daca user ul exista si nu e admin
            $stmt = $this->pdo->prepare("SELECT is_admin, username FROM users WHERE user_id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("User check result: " . print_r($user, true));

            if (!$user) {
                throw new Exception("User not found");
            }

            if ($user['is_admin'] === 't' || $user['is_admin'] === true) {
                throw new Exception("Cannot delete admin users");
            }            //sterge msj din chaturi
            $stmt = $this->pdo->prepare("
                DELETE FROM chat_messages 
                WHERE room_id IN (
                    SELECT room_id FROM chat_rooms 
                    WHERE interested_user_id = ? OR owner_id = ?
                )
            ");
            $stmt->execute([$userId, $userId]);
            error_log("Chat messages deleted");

            //sterge chat rooms
            $stmt = $this->pdo->prepare("
                DELETE FROM chat_rooms 
                WHERE interested_user_id = ? OR owner_id = ?
            ");
            $stmt->execute([$userId, $userId]);
            error_log("Chat rooms deleted");

            //sterge feeding records
            $stmt = $this->pdo->prepare("
                DELETE FROM feeding_calendar 
                WHERE animal_id IN (SELECT animal_id FROM animals WHERE added_by = ?)
            ");
            $stmt->execute([$userId]);
            error_log("Feeding records deleted");

            //sterge medical history
            $stmt = $this->pdo->prepare("
                DELETE FROM medical_history 
                WHERE animal_id IN (SELECT animal_id FROM animals WHERE added_by = ?)
            ");
            $stmt->execute([$userId]);
            error_log("Medical records deleted");

            //sterge resursele media
            $stmt = $this->pdo->prepare("
                DELETE FROM media_resources 
                WHERE animal_id IN (SELECT animal_id FROM animals WHERE added_by = ?)
            ");
            $stmt->execute([$userId]);
            error_log("Media resources deleted");

            //sterge applications
            $stmt = $this->pdo->prepare("
                DELETE FROM adoption_applications 
                WHERE applicant_id = ? OR owner_id = ? OR 
                      pet_id IN (SELECT animal_id FROM animals WHERE added_by = ?)
            ");
            $stmt->execute([$userId, $userId, $userId]);
            error_log("Adoption applications deleted");

            //sterge adoptiile
            $stmt = $this->pdo->prepare("
                DELETE FROM adoptions 
                WHERE adopter_id = ? OR 
                      animal_id IN (SELECT animal_id FROM animals WHERE added_by = ?)
            ");
            $stmt->execute([$userId, $userId]);
            error_log("Adoptions deleted");

            //sterge animalele adaugate de user
            $stmt = $this->pdo->prepare("DELETE FROM animals WHERE added_by = ?");
            $stmt->execute([$userId]);
            error_log("Animals deleted");

            //sterge adresa utilizatorului
            $stmt = $this->pdo->prepare("DELETE FROM user_addresses WHERE user_id = ?");
            $stmt->execute([$userId]);
            error_log("User address deleted");

            //sterge user
            $stmt = $this->pdo->prepare("DELETE FROM users WHERE user_id = ? AND is_admin = 'f'");
            $result = $stmt->execute([$userId]);
            
            if (!$result || $stmt->rowCount() === 0) {
                throw new Exception("Failed to delete user record");
            }
            error_log("User deleted successfully");

            $this->pdo->commit();
            error_log("Transaction committed successfully");
              echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            
        } catch (Exception $e) {
            error_log("Error in deleteUser: " . $e->getMessage());
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}