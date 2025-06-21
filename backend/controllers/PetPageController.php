<?php
require_once __DIR__ . '/../models/PetPageModel.php';
require_once __DIR__ . '/../models/PetModel.php';

//header json
header('Content-Type: application/json');

//CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class PetPageController {
    private $petPageModel;
    private $petModel;
    
    public function __construct() {
        $this->petPageModel = new PetPageModel();
        $this->petModel = new PetModel();
    }
    
    public function handleRequest() {
        try {
            if (isset($_GET['action']) && $_GET['action'] === 'getAvailable') {
                $this->getAvailableAnimals();
            } elseif (isset($_GET['action']) && $_GET['action'] === 'getAnimalById' && isset($_GET['id'])) {
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
        
        $animal = $this->petPageModel->getCompleteAnimalDetails($id);
        
        if (!$animal) {
            echo json_encode(['error' => 'Animal not found']);
            return;
        }
        
        $animal['feeding_journal'] = $this->petModel->getFeedingCalendar($id);
        $animal['medical_visits'] = $this->petModel->getMedicalHistory($id);
        
        echo json_encode($animal);
    }
    
    private function getFilteredAnimals() {
        $filters = $_GET; 
        unset($filters['action']); 
        
        $animals = $this->petPageModel->getAnimals($filters);
        echo json_encode($animals);
    }
}
$controller = new PetPageController();
$controller->handleRequest();
?>
