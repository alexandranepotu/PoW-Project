<?php
require_once __DIR__ . '/../models/PetPageModel.php';

// Header pentru JSON
header('Content-Type: application/json');

// Header pentru CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if (isset($_GET['action']) && $_GET['action'] === 'getAvailable') {
        $model = new PetPageModel();
        $animals = $model->getAvailableAnimals();
        echo json_encode($animals);
    } else {
        // Filtrare cu parametri
        $model = new PetPageModel();
        $filters = $_GET; // toți parametrii ca filtre
        unset($filters['action']); // în afară de cel de action
          $animals = $model->getAnimals($filters);
        echo json_encode($animals);
    }
} catch (Exception $e) {
    //eroare la conectare sau interogare
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
