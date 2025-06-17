<?php
require_once __DIR__ . '/../models/PetPageModel.php';

class AnimalController {
    public function getAnimals() {
        $animalModel = new Animal();
        $filters = $_GET; //preia filtrele din query string
        $animals = $animalModel->getAnimals($filters);
        echo json_encode($animals);
    }
}
?>
