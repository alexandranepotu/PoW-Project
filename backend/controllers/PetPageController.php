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
        $pdo = getDbConnection();
        //detalii animal dupa id
        $stmt = $pdo->prepare("SELECT * FROM animals WHERE animal_id = ? LIMIT 1");
        $stmt->execute([$id]);
        $animal = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($animal) {
            //owner_id mereu inclus
            if (isset($animal['added_by'])) {
                $animal['owner_id'] = $animal['added_by'];
            }
            if (!isset($animal['owner_id'])) {
                $ownerStmt = $pdo->prepare('SELECT added_by FROM animals WHERE animal_id = ?');
                $ownerStmt->execute([$id]);
                $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
                $animal['owner_id'] = $owner ? $owner['added_by'] : null;
            }
            //toate img animalului
            $stmtImg = $pdo->prepare("SELECT file_path FROM media_resources WHERE animal_id = ?");
            $stmtImg->execute([$id]);
            $animal['images'] = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
            //adaugare feedin si medical info
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
        //includ owner_id in fiecare animal
        foreach ($animals as &$animal) {
            if (isset($animal['added_by'])) {
                $animal['owner_id'] = $animal['added_by'];
            }
            if (!isset($animal['owner_id']) && isset($animal['animal_id'])) {
                $pdo2 = getDbConnection();
                $ownerStmt = $pdo2->prepare('SELECT added_by FROM animals WHERE animal_id = ?');
                $ownerStmt->execute([$animal['animal_id']]);
                $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
                $animal['owner_id'] = $owner ? $owner['added_by'] : null;
            }
        }
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
