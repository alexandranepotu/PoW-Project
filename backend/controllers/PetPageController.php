<?php
require_once __DIR__ . '/../models/PetPageModel.php';

//header json
header('Content-Type: application/json');

//CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if (isset($_GET['action']) && $_GET['action'] === 'getAvailable') {
        $model = new PetPageModel();
        $animals = $model->getAvailableAnimals();
        echo json_encode($animals);
    } elseif (isset($_GET['action']) && $_GET['action'] === 'getAnimalById' && isset($_GET['id'])) {
        $id = intval($_GET['id']);
        //fac join la animals cu media_resources ca sa iau media_url
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT a.*, m.file_path AS media_url FROM animals a LEFT JOIN media_resources m ON a.animal_id = m.animal_id WHERE a.animal_id = ? LIMIT 1");
        $stmt->execute([$id]);
        $animal = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($animal) {
            //adaugarea de calendar de hranire si vizite medicale
            require_once __DIR__ . '/../models/PetModel.php';
            global $pdo;
            $petModel = new PetModel();
            $animal['id'] = $animal['animal_id'];
            $animal['feeding_journal'] = $petModel->getFeedingCalendar($id);
            $animal['medical_visits'] = $petModel->getMedicalHistory($id);
            echo json_encode($animal);
        } else {
            echo json_encode(['error' => 'Animal not found']);
        }
        exit;
    } else {
        //filtrare animale cu parametri
        $model = new PetPageModel();
        $filters = $_GET; //toti parametrii ca filtre
        unset($filters['action']); //in afara de cel de action
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
