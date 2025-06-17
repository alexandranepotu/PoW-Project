<?php
require_once __DIR__ . '/../models/PetModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class MyPetsController {
    private $petModel;
    
    public function __construct() {
        $this->petModel = new PetModel();    }
    
    // GET /api/mypets -> lista animalelor utilizatorului
    public function getMyPets() {
        $user = AuthMiddleware::requireAuth(); //verifica daca userul e autentificat
        
        try {
            $pets = $this->petModel->getPetsByUserId($user->user_id);
            $stats = $this->petModel->getPetStatistics($user->user_id);
            
            echo json_encode([
                'success' => true,
                'pets' => $pets,
                'statistics' => $stats
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch pets']);
        }
    }
      // GET /api/mypets/{id} -> detalii complete pentru un animal
    public function getPetDetails($petId) {
        $user = AuthMiddleware::requireAuth();
        
        try {
            $petDetails = $this->petModel->getPetDetails($petId, $user->user_id);
            
            if (!$petDetails) {
                http_response_code(404);
                echo json_encode(['error' => 'Pet not found or access denied']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'pet' => $petDetails
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch pet details']);
        }
    }
      // PUT /api/mypets/{id} -> actualizare info animal
    public function updatePet($petId) {
        $user = AuthMiddleware::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input data']);
            return;
        }
        
        try {
            $result = $this->petModel->updatePet($petId, $user->user_id, $input);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Pet updated successfully']);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied or pet not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update pet']);
        }
    }
      // DELETE /api/mypets/{id} -> sterge animal
    public function deletePet($petId) {
        $user = AuthMiddleware::requireAuth();
        
        try {
            $result = $this->petModel->deletePet($petId, $user->user_id);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Pet deleted successfully']);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied or pet not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete pet']);
        }
    }
      // POST /api/mypets/{id}/feeding -> adauga feeding record
    public function addFeedingRecord($petId) {
        $user = AuthMiddleware::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['feed_time'], $input['food_type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Feed time and food type are required']);
            return;
        }
        
        try {
            //verificare daca animalul apartine utilizatorului
            $petDetails = $this->petModel->getPetDetails($petId, $user->user_id);
            if (!$petDetails) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                return;
            }
            
            $result = $this->petModel->addFeedingRecord(
                $petId,
                $input['feed_time'],
                $input['food_type'],
                $input['notes'] ?? ''
            );
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Feeding record added successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to add feeding record']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add feeding record']);
        }
    }
      // POST /api/mypets/{id}/medical -> adauga medical record
    public function addMedicalRecord($petId) {
        $user = AuthMiddleware::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['date_of_event'], $input['description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Date and description are required']);
            return;
        }
        
        try {
            // verifica daca animalul apartine utilizatorului
            $petDetails = $this->petModel->getPetDetails($petId, $user->user_id);
            if (!$petDetails) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                return;
            }
            
            $result = $this->petModel->addMedicalRecord(
                $petId,
                $input['date_of_event'],
                $input['description'],
                $input['treatment'] ?? '',
                $input['emergency'] ?? false
            );
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Medical record added successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to add medical record']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add medical record']);
        }
    }    // POST /api/mypets/{id}/media -> upload media
    public function uploadMedia($petId) {
        $user = AuthMiddleware::requireAuth();try {
            // verifica daca animalul apartine utilizatorului
            $pet = $this->petModel->getPetById($petId);
            if (!$pet || $pet['added_by'] !== $user->user_id) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                return;
            }
            
            if (!isset($_FILES['file'])) {
                throw new Exception('No file uploaded');
            }

            $file = $_FILES['file'];            $uploadedFiles = [];
            $uploadDir = '../../uploads/pets/' . $petId . '/';
            
            // Creeaza directorul daca nu exista
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            if ($file['error'] === UPLOAD_ERR_OK) {
                $fileName = $file['name'];
                $fileSize = $file['size'];
                $fileType = $file['type'];
                
                // Validare tip fisier
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
                if (!in_array($fileType, $allowedTypes)) {
                    throw new Exception('File type not allowed: ' . $fileType);
                }
                
                // Validare marime (10MB max)
                $maxSize = 10 * 1024 * 1024;
                if ($fileSize > $maxSize) {
                    throw new Exception('File too large. Maximum size is 10MB');
                }
                
                // Genereaza nume unic
                $extension = pathinfo($fileName, PATHINFO_EXTENSION);
                $uniqueName = uniqid() . '.' . $extension;
                $filePath = $uploadDir . $uniqueName;
                
                if (move_uploaded_file($file['tmp_name'], $filePath)) {
                    // salveaza in bd
                        $description = $_POST['description'] ?? '';
                        $this->petModel->addMediaResource($petId, [
                            'file_path' => '/PoW-Project/uploads/pets/' . $petId . '/' . $uniqueName,
                            'file_type' => $fileType,
                            'file_size' => $fileSize,
                            'description' => $description
                        ]);
                        
                        $uploadedFiles[] = [
                            'name' => $fileName,
                            'path' => '/PoW-Project/uploads/pets/' . $petId . '/' . $uniqueName,
                            'type' => $fileType
                        ];
                } else {
                    throw new Exception('Failed to move uploaded file');
                }
            } else {
                throw new Exception('Upload error: ' . $file['error']);
            }
            
            echo json_encode([
                'success' => true,
                'files' => $uploadedFiles,
                'message' => 'File uploaded successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
    
    // DELETE /api/mypets/feeding/{id} -> sterge feeding record
    public function deleteFeedingRecord($feedId) {
        $user = AuthMiddleware::requireAuth();
        
        try {
            $result = $this->petModel->deleteFeedingRecord($feedId);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Feeding record deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Feeding record not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete feeding record']);
        }
    }
    
    // DELETE /api/mypets/medical/{id} -> sterge medical record
    public function deleteMedicalRecord($recordId) {
        $user = AuthMiddleware::requireAuth();
        
        try {
            $result = $this->petModel->deleteMedicalRecord($recordId);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Medical record deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Medical record not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete medical record']);
        }
    }    // DELETE /api/mypets/media/{id} -> sterge media file
    public function deleteMedia($mediaId) {
        $user = AuthMiddleware::requireAuth();
        
        try {
            $result = $this->petModel->deleteMediaResource($mediaId);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Media deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Media not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete media']);
        }
    }
    
    // POST /api/mypets -> add animal nou
    public function addPet() {
        $user = AuthMiddleware::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            return;
        }
        
        //validare date obligatorii
        $required = ['name', 'species'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }
        
        try {
            $petData = [
                'name' => $input['name'],
                'species' => $input['species'],
                'breed' => $input['breed'] ?? '',
                'age' => !empty($input['age']) ? intval($input['age']) : null,
                'sex' => $input['sex'] ?? null,
                'health_status' => $input['healthStatus'] ?? $input['health_status'] ?? '',
                'description' => $input['description'] ?? '',
                'added_by' => $user->user_id            ];
            
            $result = $this->petModel->insertPet($petData);
            
            if (!$result['success']) {
                if (isset($result['requiresAddress']) && $result['requiresAddress']) {
                    http_response_code(400);
                    echo json_encode([
                        'error' => $result['error'],
                        'requiresAddress' => true
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => $result['error']]);
                }
                return;
            }
            
            $petId = $result['petId'];
            
            //adauga feedings daca exista
            if (!empty($input['feedings'])) {
                $this->petModel->insertFeedings($petId, $input['feedings']);
            }
            
            //adauga medical records daca exista
            if (!empty($input['medical'])) {
                $this->petModel->insertMedicalRecords($petId, $input['medical']);
            }
            
            //adauga media daca exista
            if (!empty($input['media'])) {
                $this->petModel->insertMedia($petId, $input['media']);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Pet added successfully',
                'pet_id' => $petId,
                'address' => $result['address']
            ]);
            
        } catch (Exception $e) {
            error_log('Error adding pet: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add pet']);
        }
    }
    
    // GET /api/pets -> toate animalele pentru dashboard general-> daca nu adaug cards pt filtrare
    public function getAllPets() {
        try {
            $pets = $this->petModel->getAllPets();
            
            echo json_encode([
                'success' => true,
                'pets' => $pets
            ]);
            
        } catch (Exception $e) {
            error_log('Error getting all pets: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch pets']);
        }
    }    // PUT /api/mypets/{id}/pickup-address -> actualizare adresa utilizator
    public function updatePickupAddress($petId) {
        $user = AuthMiddleware::requireAuth();
        
        try {
            // verif daca utiliz are are adresa setata           
            // verif daca animalul apartine utilizatorului
            $petDetails = $this->petModel->getPetDetails($petId, $user->user_id);
            if (!$petDetails) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied - pet not found or does not belong to you']);
                return;
            }
            
            $result = $this->petModel->updatePickupAddress($petId, $user->user_id);
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true, 
                    'message' => $result['message'],
                    'address' => $result['address']
                ]);
            } else {
                if (isset($result['requiresAddress']) && $result['requiresAddress']) {
                    http_response_code(400);
                    echo json_encode([
                        'error' => $result['error'],
                        'requiresAddress' => true
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => $result['error']]);
                }
            }
            
        } catch (Exception $e) {
            error_log('Error in updatePickupAddress: ' . $e->getMessage());
            http_response_code(500);            echo json_encode(['error' => 'Internal server error']);
        }
    }
}
?>
