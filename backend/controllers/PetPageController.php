<?php
require_once __DIR__ . '/../models/PetPageModel.php';
require_once __DIR__ . '/../models/PetModel.php';

class PetPageController {
    private $petPageModel;
    private $petModel;
    
    public function __construct() {
        $this->petPageModel = new PetPageModel();
        $this->petModel = new PetModel();
    }      public function handleRequest() {
        try {
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'getAvailable':
                        $this->getAvailableAnimals();
                        break;
                    case 'getUserPets':
                        $this->getUserPets();
                        break;
                    default:
                        $this->getFilteredAnimals();
                }
            } elseif (isset($_GET['id'])) {
                $this->getAnimalById();
            } else {
                // Filtrare animale cu parametri
                $this->getFilteredAnimals();
            }
        } catch (Exception $e) {
            error_log("PetPageController error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'error' => true,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }
    
    private function getAvailableAnimals() {
        $animals = $this->petPageModel->getAvailableAnimals();
        echo json_encode($animals);
    }
      private function getAnimalById() {
        $id = intval($_GET['id']);

        $animals = $this->petPageModel->getAnimals(['id' => $id]);
        
        if (empty($animals)) {
            echo json_encode(['error' => 'Animal not found']);
            return;
        }
        
        echo json_encode($animals[0]);
    }
    
    private function getFilteredAnimals() {
        $filters = $_GET; 
        unset($filters['action']); 
          $animals = $this->petPageModel->getAnimals($filters);
        echo json_encode($animals);
    }
      private function getUserPets() {
        try {
            if (!isset($_GET['userId'])) {
                throw new Exception('User ID is required');
            }
            
            $userId = intval($_GET['userId']);
            error_log("Attempting to get pets for user ID: " . $userId);
            
            try {
                $pets = $this->petPageModel->getAnimalsByUser($userId);
                error_log("Successfully retrieved pets: " . json_encode($pets));
                header('Content-Type: application/json');
                echo json_encode($pets);
            } catch (Exception $e) {
                error_log("Database error: " . $e->getMessage());
                throw new Exception('Database error while retrieving pets');
            }
        } catch (Exception $e) {
            error_log("Error in getUserPets: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
