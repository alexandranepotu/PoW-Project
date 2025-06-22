<?php
require_once __DIR__ . '/../config/db.php';

//gestioneaza animalele
class PetModel {
    private $pdo;
    
    public function __construct() {
        global $pdo; // foloseste conexiunea la baza de date din config
        $this->pdo = $pdo; }    //operatii crud
    public function insertPet($data) {
        try {
            // obtine adresa utilizatorului
            $pickupAddress = $this->getUserAddress($data['added_by']);
            
            //verif daca adresa exista
            if (!$pickupAddress) {
                return [
                    'success' => false,
                    'error' => 'No address found. Please add your address in Profile page first.',
                    'requiresAddress' => true
                ];
            }
            
            $stmt = $this->pdo->prepare("INSERT INTO animals (name, species, breed, age, sex, health_status, description, added_by, pickup_address) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $result = $stmt->execute([
                $data['name'],
                $data['species'],
                $data['breed'],
                $data['age'],
                $data['sex'],
                $data['health_status'] ?? 'unknown',
                $data['description'],
                $data['added_by'], 
                $pickupAddress
            ]);
            if ($result) {
                return [
                    'success' => true,
                    'petId' => $this->pdo->lastInsertId(),
                    'address' => $pickupAddress
                ];
            }
            return ['success' => false, 'error' => 'Failed to add pet'];
        } catch (PDOException $e) {
            error_log('Error inserting pet: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Database error'];
        }
    }
    public function insertFeedings($petId, $feedings) {
        try {
            $stmt = $this->pdo->prepare("INSERT INTO feeding_calendar (animal_id, feed_time, food_type, notes) 
                                VALUES (?, ?, ?, ?)");

            foreach ($feedings as $f) {
                $stmt->execute([
                    $petId, 
                    $f['feed_time'], 
                    $f['food_type'], 
                    $f['notes'] ?? ''
                ]);
            }
            return true;
        } catch (PDOException $e) {
            error_log('Error inserting feeding records: ' . $e->getMessage());
            return false;
        }
    }    
    public function insertMedicalRecords($petId, $medicalRecords) {
        try {
            $stmt = $this->pdo->prepare("INSERT INTO medical_history (animal_id, date_of_event, description, treatment, emergency) VALUES (?, ?, ?, ?, ?)");
            foreach ($medicalRecords as $m) {
                $emergency = $m['emergency'] ?? false;
                if (empty($emergency) || $emergency === '' || $emergency === null) {
                    $emergency = false;
                }
                $emergency = ($emergency === true) ? true : false;
                error_log('EMERGENCY FINAL VALUE: ' . var_export($emergency, true));
                $params = [$petId, $m['date_of_event'], $m['description'], $m['treatment'] ?? '', $emergency ? 1 : 0];
                error_log('SQL PARAMS: ' . var_export($params, true));
                $stmt->execute($params);
            }
            return true;
        } catch (PDOException $e) {
            error_log('Error inserting medical records: ' . $e->getMessage());
            return false;
        }
    }

    public function insertMedia($petId, $mediaList) {
        try {
            $stmt = $this->pdo->prepare("INSERT INTO media_resources (animal_id, type, file_path, description) VALUES (?, ?, ?, ?)");

            foreach ($mediaList as $m) {
                $stmt->execute([
                    $petId, 
                    'image',
                    'uploads/placeholder.jpg',
                    $m['description'] ?? ''
                ]);
            }
            return true;
            
        } catch (PDOException $e) {
            error_log('Error inserting media: ' . $e->getMessage());
            return false;
        }
    }
    
    // obtine animalele unui utilizator
    public function getPetsByUserId($userId) {
        try {
            error_log("PetModel: Fetching pets for user ID " . $userId);
            
            $query = "
                SELECT DISTINCT
                    a.*,
                    m.file_path as media_url,
                    u.username as owner_username
                FROM animals a
                LEFT JOIN media_resources m ON a.animal_id = m.animal_id AND m.type = 'image'
                LEFT JOIN users u ON a.added_by = u.user_id
                WHERE a.added_by = ?
                ORDER BY a.created_at DESC
            ";
            
            $stmt = $this->pdo->prepare($query);
            
            if (!$stmt) {
                error_log("PetModel: Error preparing statement: " . print_r($this->pdo->errorInfo(), true));
                throw new PDOException("Failed to prepare statement");
            }
            
            $stmt->bindValue(1, $userId, PDO::PARAM_INT);
            $success = $stmt->execute();
            
            if (!$success) {
                error_log("PetModel: Error executing statement: " . print_r($stmt->errorInfo(), true));
                throw new PDOException("Failed to execute statement");
            }
            
            $pets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("PetModel: Found " . count($pets) . " pets");
              return $pets ?: [];
            
        } catch (PDOException $e) {            error_log("PetModel: Database error in getPetsByUserId: " . $e->getMessage());
            throw new Exception("Database error while fetching pets: " . $e->getMessage());
        }
    }
    
    //toate animalele
    public function getAllPets($limit = null) {
        try {
            $sql = "SELECT a.*, u.username as added_by_username 
                    FROM animals a 
                    LEFT JOIN users u ON a.added_by = u.user_id 
                    ORDER BY a.animal_id DESC";
            
            if ($limit) {
                $sql .= " LIMIT " . intval($limit);
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log('Error getting all pets: ' . $e->getMessage());
            return [];
        }    }
    
    // obtine un animal dupa ID (pt verificare stapan)
    public function getPetById($petId) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM animals WHERE animal_id = ?");
            $stmt->execute([$petId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log('Error getting pet by ID: ' . $e->getMessage());
            return null;
        }
    }
    
    // pt My Pets
    
    //obtine detalii complete despre un animal
    public function getPetDetails($petId, $userId) {
        try {
            //verificare->daca apartine unui utilizator
            $stmt = $this->pdo->prepare("SELECT * FROM animals WHERE animal_id = ? AND added_by = ?");
            $stmt->execute([$petId, $userId]);
            $pet = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$pet) {
                return null;
            }
            
            //adauga info
            $pet['feeding_calendar'] = $this->getFeedingCalendar($petId);
            $pet['medical_history'] = $this->getMedicalHistory($petId);
            $pet['media'] = $this->getMediaResources($petId);
            
            return $pet;
            
        } catch (PDOException $e) {
            error_log('Error getting pet details: ' . $e->getMessage());
            return null;
        }
    }
    
    //feedings calendar
    public function getFeedingCalendar($petId, $limit = 20) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM feeding_calendar WHERE animal_id = ? ORDER BY feed_time DESC LIMIT ?");
            $stmt->execute([$petId, $limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log('Error getting feeding calendar: ' . $e->getMessage());
            return [];
        }
    }
    
    public function addFeedingRecord($petId, $feedTime, $foodType, $notes = '') {
        try {
            $stmt = $this->pdo->prepare("INSERT INTO feeding_calendar (animal_id, feed_time, food_type, notes) VALUES (?, ?, ?, ?)");
            return $stmt->execute([$petId, $feedTime, $foodType, $notes]);
            
        } catch (PDOException $e) {
            error_log('Error adding feeding record: ' . $e->getMessage());
            return false;
        }
    }
    
    public function updateFeedingRecord($feedId, $feedTime, $foodType, $notes) {
        try {
            $stmt = $this->pdo->prepare("UPDATE feeding_calendar SET feed_time = ?, food_type = ?, notes = ? WHERE feed_id = ?");
            return $stmt->execute([$feedTime, $foodType, $notes, $feedId]);
            
        } catch (PDOException $e) {
            error_log('Error updating feeding record: ' . $e->getMessage());
            return false;
        }
    }
    
    public function deleteFeedingRecord($feedId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM feeding_calendar WHERE feed_id = ?");
            return $stmt->execute([$feedId]);
            
        } catch (PDOException $e) {
            error_log('Error deleting feeding record: ' . $e->getMessage());
            return false;
        }
    }
    
    //medical history
    public function getMedicalHistory($petId) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM medical_history WHERE animal_id = ? ORDER BY date_of_event DESC");
            $stmt->execute([$petId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log('Error getting medical history: ' . $e->getMessage());
            return [];
        }
    }
    
    public function addMedicalRecord($petId, $dateOfEvent, $description, $treatment = '', $emergency = false) {
        try {
            error_log('EMERGENCY RAW VALUE: ' . var_export($emergency, true));
            if (empty($emergency) || $emergency === '' || $emergency === null) {
                $emergency = false;
            }
            $emergency = ($emergency === true) ? true : false;
            error_log('EMERGENCY FINAL VALUE: ' . var_export($emergency, true));
            $params = [$petId, $dateOfEvent, $description, $treatment, $emergency ? 1 : 0];
            error_log('SQL PARAMS: ' . var_export($params, true));
            $stmt = $this->pdo->prepare("INSERT INTO medical_history (animal_id, date_of_event, description, treatment, emergency) VALUES (?, ?, ?, ?, ?)");
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('Error adding medical record: ' . $e->getMessage());
            return false;
        }
    }
    
    public function updateMedicalRecord($recordId, $dateOfEvent, $description, $treatment, $emergency) {
        try {
            $stmt = $this->pdo->prepare("UPDATE medical_history SET date_of_event = ?, description = ?, treatment = ?, emergency = ? WHERE record_id = ?");
            return $stmt->execute([$dateOfEvent, $description, $treatment, $emergency, $recordId]);
            
        } catch (PDOException $e) {
            error_log('Error updating medical record: ' . $e->getMessage());
            return false;
        }
    }
    
    public function deleteMedicalRecord($recordId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM medical_history WHERE record_id = ?");
            return $stmt->execute([$recordId]);
            
        } catch (PDOException $e) {
            error_log('Error deleting medical record: ' . $e->getMessage());
            return false;
        }
    }
    
    //media
    public function getMediaResources($petId) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM media_resources WHERE animal_id = ? ORDER BY uploaded_at DESC");
            $stmt->execute([$petId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log('Error getting media resources: ' . $e->getMessage());
            return [];
        }
    }    public function addMediaResource($petId, $mediaData) {
        try {
            // determina tipul simplu 
            $simpleType = 'unknown';
            if (strpos($mediaData['file_type'], 'image/') === 0) {
                $simpleType = 'image';
            } elseif (strpos($mediaData['file_type'], 'video/') === 0) {
                $simpleType = 'video';
            }
            
            $stmt = $this->pdo->prepare("INSERT INTO media_resources (animal_id, type, file_path) VALUES (?, ?, ?)");
            return $stmt->execute([
                $petId, 
                $simpleType, 
                $mediaData['file_path']
            ]);
            
        } catch (PDOException $e) {
            error_log('Error adding media resource: ' . $e->getMessage());
            return false;
        }
    }
    
    public function deleteMediaResource($mediaId) {
        try {
            //calea fisierului media->file_path
            $stmt = $this->pdo->prepare("SELECT file_path FROM media_resources WHERE media_id = ?");
            $stmt->execute([$mediaId]);
            $media = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($media && file_exists($media['file_path'])) {
                unlink($media['file_path']);
            }
            
            //sterge din bd
            $stmt = $this->pdo->prepare("DELETE FROM media_resources WHERE media_id = ?");
            return $stmt->execute([$mediaId]);
            
        } catch (PDOException $e) {
            error_log('Error deleting media resource: ' . $e->getMessage());
            return false;
        }    }
    
    //actualizare info pet
    public function updatePet($petId, $userId, $data) {
        try {
            //verifica daca apartine userului
            $stmt = $this->pdo->prepare("SELECT animal_id FROM animals WHERE animal_id = ? AND added_by = ?");
            $stmt->execute([$petId, $userId]);
            if (!$stmt->fetch()) {
                return false; //nu are drept sa modifice
            }
            
            $stmt = $this->pdo->prepare("UPDATE animals SET name = ?, species = ?, breed = ?, age = ?, sex = ?, health_status = ?, description = ? WHERE animal_id = ?");
            return $stmt->execute([
                $data['name'],
                $data['species'],
                $data['breed'],
                $data['age'],
                $data['sex'],
                $data['health_status'],
                $data['description'],
                $petId
            ]);
            
        } catch (PDOException $e) {
            error_log('Error updating pet: ' . $e->getMessage());
            return false;
        }
    }
    
    //sterge pet + datele asociate
    public function deletePet($petId, $userId) {
        try {
            //verifica daca apartine userului
            $stmt = $this->pdo->prepare("SELECT animal_id FROM animals WHERE animal_id = ? AND added_by = ?");
            $stmt->execute([$petId, $userId]);
            if (!$stmt->fetch()) {
                return false; //nu are drept sa verifice
            }
            
            // sterge fisierele media asociate
            $media = $this->getMediaResources($petId);
            foreach ($media as $item) {
                if (file_exists($item['file_path'])) {
                    unlink($item['file_path']);
                }
            }
            
            //sterge din bd
            $stmt = $this->pdo->prepare("DELETE FROM animals WHERE animal_id = ?");
            return $stmt->execute([$petId]);
            
        } catch (PDOException $e) {
            error_log('Error deleting pet: ' . $e->getMessage());
            return false;
        }
    }
    
    // statistici-> mai tb?????????????
    public function getPetStatistics($userId) {
        try {
            $stats = [];
            
            //nr total de animale
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as total_pets FROM animals WHERE added_by = ?");
            $stmt->execute([$userId]);
            $stats['total_pets'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_pets'];
            
            
        } catch (PDOException $e) {
            error_log('Error getting pet statistics: ' . $e->getMessage());
            return [];
        }
    }   
    public function updatePickupAddress($petId, $userId) {
        try {
            $stmt = $this->pdo->prepare("SELECT animal_id FROM animals WHERE animal_id = ? AND added_by = ?");
            $stmt->execute([$petId, $userId]);
            if (!$stmt->fetch()) {
                error_log("Pet $petId does not belong to user $userId");
                return ['success' => false, 'error' => 'Pet does not belong to user']; 
            }
            
            // obt adresa utilizatorului
            $userAddress = $this->getUserAddress($userId);
            
            //verif daca utilizatorul are adresa
            if (!$userAddress) {
                return [
                    'success' => false, 
                    'error' => 'No address found. Please add your address in Profile page first.',
                    'requiresAddress' => true
                ];
            }
            
            $stmt = $this->pdo->prepare("UPDATE animals SET pickup_address = ? WHERE animal_id = ?");
            $result = $stmt->execute([
                $userAddress,
                $petId
            ]);
            
            if ($result) {
                return [
                    'success' => true, 
                    'address' => $userAddress,
                    'message' => 'Pickup address updated successfully!'
                ];
            }
            
            return ['success' => false, 'error' => 'Failed to update address'];
            
        } catch (PDOException $e) {
            error_log('Error updating pickup address: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Database error'];
        }
    }
    
    //obtine adresa utilizatorului pentru afisare
    public function getUserAddressForDisplay($userId) {
        return $this->getUserAddress($userId);
    }  
    public function getUserAddress($userId) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM user_addresses WHERE user_id = ? LIMIT 1");
            $stmt->execute([$userId]);
            $address = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$address) {
                //daca nu are adresa setata
                return null;
            }
            
            // adresa completa
            $fullAddress = [];
            if (!empty($address['street'])) $fullAddress[] = $address['street'];
            if (!empty($address['city'])) $fullAddress[] = $address['city'];
            if (!empty($address['county'])) $fullAddress[] = $address['county'];
            if (!empty($address['country'])) $fullAddress[] = $address['country'];
            if (!empty($address['postal_code'])) $fullAddress[] = $address['postal_code'];
            
            $result = implode(', ', $fullAddress);
            
            return !empty($result) ? $result : null;
            
        } catch (PDOException $e) {
            error_log('Error getting user address: ' . $e->getMessage());
            return null;
        }    }    // verif daca utilizatorul are o adresa reala
    public function userHasRealAddress($userId) {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log('Error checking user address: ' . $e->getMessage());
            return false;
        }
    }
}
?>