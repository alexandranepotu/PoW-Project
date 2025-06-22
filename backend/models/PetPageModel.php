<?php
require_once __DIR__ . '/../config/db.php';

class PetPageModel {
    private $pdo;

    public function __construct() {
        $this->pdo = getDbConnection();
    }    public function getAnimals($filters) {
        if (!empty($filters['id'])) {
            //filtrare dupa id
            $query = "SELECT a.* FROM animals a WHERE a.animal_id = ?";
            $params = [intval($filters['id'])];
        } else {
            $query = "SELECT a.* FROM animals a WHERE a.available = TRUE";
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
            }
            if (!empty($filters['health_status'])) {
                $query .= " AND a.health_status ILIKE ?";
                $params[] = '%' . $filters['health_status'] . '%';
            }
        }
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        //mereu includ owner_id in fiecare animal
        foreach ($results as &$animal) {
            //mapa la id ul de owner pt compatibilitate
            if (isset($animal['added_by'])) {
                $animal['owner_id'] = $animal['added_by'];
            }
            if (!isset($animal['owner_id']) && isset($animal['animal_id'])) {
                $ownerStmt = $this->pdo->prepare('SELECT added_by FROM animals WHERE animal_id = ?');
                $ownerStmt->execute([$animal['animal_id']]);
                $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
                $animal['owner_id'] = $owner ? $owner['added_by'] : null;
            }            //array de img si video pt fiecare animal
            if (isset($animal['animal_id'])) {
                // Imagini
                $imgStmt = $this->pdo->prepare('SELECT file_path FROM media_resources WHERE animal_id = ? AND type = ?');
                $imgStmt->execute([$animal['animal_id'], 'image']);
                $images = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
                $animal['images'] = $images;
                
                // Video-uri
                $videoStmt = $this->pdo->prepare('SELECT file_path FROM media_resources WHERE animal_id = ? AND type = ?');
                $videoStmt->execute([$animal['animal_id'], 'video']);
                $videos = $videoStmt->fetchAll(PDO::FETCH_COLUMN);
                $animal['videos'] = $videos;
                
                //media_url ca prima imagine sau null daca nu exista
                $animal['media_url'] = isset($images[0]) ? $images[0] : null;
            }
            //feeding
            if (isset($animal['animal_id'])) {
                $feedStmt = $this->pdo->prepare('SELECT feed_time, food_type, notes FROM feeding_calendar WHERE animal_id = ? ORDER BY feed_time DESC');
                $feedStmt->execute([$animal['animal_id']]);
                $animal['feeding_journal'] = $feedStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            //medical
            if (isset($animal['animal_id'])) {
                $medStmt = $this->pdo->prepare('SELECT date_of_event, description, treatment, emergency FROM medical_history WHERE animal_id = ? ORDER BY date_of_event DESC');
                $medStmt->execute([$animal['animal_id']]);
                $animal['medical_visits'] = $medStmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
        return $results;
    }    public function getAvailableAnimals() {
        $query = "SELECT a.*, (
            SELECT m.file_path FROM media_resources m WHERE m.animal_id = a.animal_id LIMIT 1
        ) AS media_url
        FROM animals a
        WHERE a.available = TRUE";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAnimalById($animalId) {
        $stmt = $this->pdo->prepare("SELECT * FROM animals WHERE animal_id = ? LIMIT 1");
        $stmt->execute([$animalId]);
        $animal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$animal) {
            return null;
        }
        
        if (isset($animal['added_by'])) {
            $animal['owner_id'] = $animal['added_by'];
        }
        
        if (!isset($animal['owner_id'])) {
            $ownerStmt = $this->pdo->prepare('SELECT added_by FROM animals WHERE animal_id = ?');
            $ownerStmt->execute([$animalId]);
            $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
            $animal['owner_id'] = $owner ? $owner['added_by'] : null;
        }
        
        return $animal;
    }    public function getAnimalImages($animalId) {
        $stmt = $this->pdo->prepare("SELECT file_path FROM media_resources WHERE animal_id = ? AND type = 'image'");
        $stmt->execute([$animalId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getAnimalVideos($animalId) {
        $stmt = $this->pdo->prepare("SELECT file_path FROM media_resources WHERE animal_id = ? AND type = 'video'");
        $stmt->execute([$animalId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }    public function getCompleteAnimalDetails($animalId) {
        $animal = $this->getAnimalById($animalId);
        
        if (!$animal) {
            return null;
        }
    
        $animal['images'] = $this->getAnimalImages($animalId);
        $animal['videos'] = $this->getAnimalVideos($animalId);
        $animal['id'] = $animal['animal_id'];
        
        return $animal;
    }

    public function getFeedingCalendar($animalId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    date,
                    food_type,
                    quantity,
                    notes
                FROM feeding_schedule 
                WHERE animal_id = ? 
                ORDER BY date DESC
            ");
            $stmt->execute([$animalId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting feeding calendar: " . $e->getMessage());
            return [];
        }
    }
    
    public function getMedicalHistory($animalId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    visit_date,
                    veterinarian,
                    diagnosis,
                    treatment,
                    notes,
                    next_visit
                FROM medical_history 
                WHERE animal_id = ? 
                ORDER BY visit_date DESC
            ");
            $stmt->execute([$animalId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting medical history: " . $e->getMessage());
            return [];
        }
    }
}
?>
