<?php
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/AdminModel.php';
require_once __DIR__ . '/../config/db.php';

class AdminController {
    private $adminModel;

    public function __construct($pdo = null) {
        if ($pdo === null) {
            $pdo = getDbConnection();
        }
        $this->adminModel = new AdminModel($pdo);
    }    public function getAllUsers() {
        try {
            // Verifica autentificarea prin JWT
            $user = AuthMiddleware::getAuthenticatedUser();
            if (!$user) {
                throw new Exception("User not authenticated");
            }
            
            AdminMiddleware::requireAdmin();
            
            header('Content-Type: application/json');
            header("Cache-Control: no-cache, no-store, must-revalidate");
            
            $currentUserId = $user->user_id;
            $users = $this->adminModel->getAllUsersWithStats();
            
            // Exclude utilizatorul curent (admin-ul logat) din lista de users
            $filteredUsers = array_filter($users, function($userItem) use ($currentUserId) {
                return $userItem['user_id'] != $currentUserId;
            });
            
            // Reindex array pentru a avea indexi consecutivi
            $filteredUsers = array_values($filteredUsers);
            
            echo json_encode([
                'success' => true,
                'users' => $filteredUsers
            ]);
            
        } catch (Exception $e) {
            error_log("AdminController::getAllUsers - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch users: ' . $e->getMessage()
            ]);
        }
    }

    public function getAllAnimals() {
        try {
            AdminMiddleware::requireAdmin();
            
            header('Content-Type: application/json');
            
            $animals = $this->adminModel->getAllAnimalsWithOwners();
            
            echo json_encode([
                'success' => true,
                'animals' => $animals
            ]);
            
        } catch (Exception $e) {
            error_log("AdminController::getAllAnimals - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch animals'
            ]);
        }
    }

    public function getAllApplications() {
        try {
            AdminMiddleware::requireAdmin();
            
            header('Content-Type: application/json');
            
            $applications = $this->adminModel->getAllApplications();
            
            echo json_encode([
                'success' => true,
                'applications' => $applications
            ]);
            
        } catch (Exception $e) {
            error_log("AdminController::getAllApplications - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch applications'
            ]);
        }
    }

    public function getDashboardStats() {
        try {
            AdminMiddleware::requireAdmin();
            
            header('Content-Type: application/json');
            
            $stats = $this->adminModel->getDashboardStats();
            
            echo json_encode([
                'success' => true,
                'stats' => $stats
            ]);
            
        } catch (Exception $e) {
            error_log("AdminController::getDashboardStats - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch stats'
            ]);
        }
    }

    public function deleteUser($userId) {
        try {
            AdminMiddleware::requireAdmin();
            
            if (!$userId) {
                throw new Exception("User ID is required");
            }
            
            $result = $this->adminModel->deleteUser($userId);
            
            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Failed to delete user");
            }
            
        } catch (Exception $e) {
            error_log("AdminController::deleteUser - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete user: ' . $e->getMessage()
            ]);
        }
    }

    public function deleteAnimal($animalId) {
        try {
            AdminMiddleware::requireAdmin();
            
            if (!$animalId) {
                throw new Exception("Animal ID is required");
            }
            
            $result = $this->adminModel->deleteAnimal($animalId);
            
            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Failed to delete animal");
            }
            
        } catch (Exception $e) {
            error_log("AdminController::deleteAnimal - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete animal: ' . $e->getMessage()
            ]);
        }
    }

    public function updateAnimalStatus($animalId, $status) {
        try {
            AdminMiddleware::requireAdmin();
            
            if (!$animalId || !$status) {
                throw new Exception("Animal ID and status are required");
            }
            
            $result = $this->adminModel->updateAnimalStatus($animalId, $status);
            
            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Failed to update animal status");
            }
            
        } catch (Exception $e) {
            error_log("AdminController::updateAnimalStatus - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update animal status: ' . $e->getMessage()
            ]);
        }
    }

    public function toggleUserAdmin($userId, $isAdmin) {
        try {
            AdminMiddleware::requireAdmin();
            
            if (!$userId || !isset($isAdmin)) {
                throw new Exception("User ID and admin status are required");
            }
            
            $result = $this->adminModel->toggleUserAdmin($userId, $isAdmin);
            
            if ($result) {
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Failed to toggle user admin status");
            }
            
        } catch (Exception $e) {
            error_log("AdminController::toggleUserAdmin - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to toggle admin status: ' . $e->getMessage()
            ]);
        }
    }

    public function searchUsers($searchTerm) {
        try {
            AdminMiddleware::requireAdmin();
            
            header('Content-Type: application/json');
            
            $users = $this->adminModel->searchUsers($searchTerm);
            
            echo json_encode([
                'success' => true,
                'users' => $users
            ]);
            
        } catch (Exception $e) {
            error_log("AdminController::searchUsers - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to search users'
            ]);
        }
    }

    public function searchAnimals($searchTerm) {
        try {
            AdminMiddleware::requireAdmin();
            
            header('Content-Type: application/json');
            
            $animals = $this->adminModel->searchAnimals($searchTerm);
            
            echo json_encode([
                'success' => true,
                'animals' => $animals
            ]);
            
        } catch (Exception $e) {
            error_log("AdminController::searchAnimals - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to search animals'
            ]);
        }
    }
}
?>
