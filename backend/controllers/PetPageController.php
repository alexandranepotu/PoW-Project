<?php
//pt debugging pun error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../models/PetPageModel.php';

//header pt json
header('Content-Type: application/json');

//header pt CORS, adica acces de pe orice origine
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if (isset($_GET['action']) && $_GET['action'] === 'getAvailable') {
        $model = new PetPageModel();
        $animals = $model->getAvailableAnimals();
        
        //debug sa vad cate rezultate sunt
        error_log("Animals found: " . count($animals));
        
        echo json_encode($animals);
    } else {
        //filtrare cu parametri
        $model = new PetPageModel();
        $filters = $_GET; //toti parametrii ca filtre
        unset($filters['action']); //in afara de cel de action
        
        $animals = $model->getAnimals($filters);
        
        error_log("Filtered animals found: " . count($animals));
        
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
