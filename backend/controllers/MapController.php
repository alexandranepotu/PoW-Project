<?php
require_once __DIR__ . '/../models/MapModel.php';

class MapController {
    private $mapModel;

    public function __construct($pdo) {
        $this->mapModel = new MapModel($pdo);
    }

    public function getUsersLocations() {
        try {           
            $currentUserId = $this->getCurrentUserId();
            
            $users = $this->mapModel->getUsersLocations($currentUserId);

            $usersWithCoords = [];
            foreach ($users as $user) {
                $coordinates = $this->geocodeAddress($user);
                if ($coordinates) {
                    $user['latitude'] = $coordinates['lat'];
                    $user['longitude'] = $coordinates['lng'];
                    $user['animals'] = $this->mapModel->getUserAnimals($user['user_id']);
                    $usersWithCoords[] = $user;
                }
            }

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'users' => $usersWithCoords
            ]);

        } catch (Exception $e) {
            error_log("MapController::getUsersLocations - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to get users locations'
            ]);
        }
    }

    public function searchUsersByLocation($searchTerm) {
        try {
            $users = $this->mapModel->searchUsersByLocation($searchTerm);
            
            $usersWithCoords = [];
            foreach ($users as $user) {
                $coordinates = $this->geocodeAddress($user);
                if ($coordinates) {
                    $user['latitude'] = $coordinates['lat'];
                    $user['longitude'] = $coordinates['lng'];
                    $user['animals'] = $this->mapModel->getUserAnimals($user['user_id']);
                    $usersWithCoords[] = $user;
                }
            }

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'users' => $usersWithCoords
            ]);

        } catch (Exception $e) {
            error_log("MapController::searchUsersByLocation - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to search users by location'
            ]);
        }
    }

    public function getAllCities() {
        try {
            $cities = $this->mapModel->getAllCities();
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'cities' => $cities
            ]);

        } catch (Exception $e) {
            error_log("MapController::getAllCities - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to get cities'
            ]);
        }
    }

    public function getUsersByCity($city) {
        try {
            $currentUserId = $this->getCurrentUserId();
            $users = $this->mapModel->getUsersByCity($city, $currentUserId);
            
            $usersWithCoords = [];
            foreach ($users as $user) {
                $coordinates = $this->geocodeAddress($user);
                if ($coordinates) {
                    $user['latitude'] = $coordinates['lat'];
                    $user['longitude'] = $coordinates['lng'];
                    $user['animals'] = $this->mapModel->getUserAnimals($user['user_id']);
                    $usersWithCoords[] = $user;
                }
            }

            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'users' => $usersWithCoords
            ]);

        } catch (Exception $e) {
            error_log("MapController::getUsersByCity - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to get users by city'
            ]);
        }
    }

    private function getCurrentUserId() {
        return $_SESSION['user_id'] ?? null;
    }

    private function geocodeAddress($user) {
        $addressParts = array_filter([
            $user['street'] ?? '',
            $user['city'] ?? '',
            $user['county'] ?? '',
            $user['country'] ?? ''
        ]);
        
        $address = implode(', ', $addressParts);
        
        if (empty($address)) {
            return null;
        }

        $url = "https://nominatim.openstreetmap.org/search?format=json&q=" . urlencode($address) . "&limit=1";
        
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => 'User-Agent: PetAdoptionApp/1.0'
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            error_log("Geocoding failed for address: " . $address);
            return null;
        }
        
        $data = json_decode($response, true);
        
        if (!empty($data) && isset($data[0]['lat'], $data[0]['lon'])) {
            return [
                'lat' => floatval($data[0]['lat']),
                'lng' => floatval($data[0]['lon'])
            ];
        }
        
        return null;
    }
}
?>
