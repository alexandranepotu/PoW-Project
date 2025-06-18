<?php
require_once __DIR__ . '/../config/db.php';

class PetPageModel {
    private $pdo;

    public function __construct() {
        $this->pdo = getDbConnection();
    }    public function getAnimals($filters) {
        // verific daca animalul e disponibil
        $query = "SELECT a.*, m.file_path AS media_url
                  FROM animals a 
                  LEFT JOIN media_resources m ON a.animal_id = m.animal_id 
                  WHERE a.available = TRUE";
        
        $params = [];

        if (!empty($filters['species'])) {
            $query .= " AND a.species ILIKE ?";
            $params[] = '%' . $filters['species'] . '%';
        }
        if (!empty($filters['breed'])) {
            $query .= " AND a.breed ILIKE ?";
            $params[] = '%' . $filters['breed'] . '%';
        }
        if (!empty($filters['age'])) {
            $query .= " AND a.age = ?";
            $params[] = intval($filters['age']);
        }
        if (!empty($filters['sex'])) {
            $query .= " AND a.sex = ?";
            $params[] = $filters['sex'];
        }        if (!empty($filters['health_status'])) {
            $query .= " AND a.health_status ILIKE ?";
            $params[] = '%' . $filters['health_status'] . '%';
        }

        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }    public function getAvailableAnimals() {
        $query = "SELECT a.*, m.file_path AS media_url
                  FROM animals a 
                  LEFT JOIN media_resources m ON a.animal_id = m.animal_id 
                  WHERE a.available = TRUE";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
