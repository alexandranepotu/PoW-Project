<?php
require_once __DIR__ . '/../models/MapModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class MapController {
    private $mapModel;

    public function __construct($pdo) {
        $this->mapModel = new MapModel($pdo);
    }public function getUsersLocations() {
        try {           
            $currentUserId = $this->getCurrentUserId();
            error_log("MapController::getUsersLocations - Current user ID: " . ($currentUserId ?? 'null'));
            
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
    }    private function getCurrentUserId() {
        // Foloseste JWT pentru a obtine ID-ul utilizatorului autentificat
        $user = AuthMiddleware::getAuthenticatedUser();
        return $user ? $user->user_id : null;
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
    }    public function getCurrentUserLocation() {
        try {
            $currentUserId = $this->getCurrentUserId();
            error_log("MapController::getCurrentUserLocation - Current user ID: " . ($currentUserId ?? 'null'));
            
            if (!$currentUserId) {
                throw new Exception("User not authenticated");
            }
              $userAddress = $this->mapModel->getUserAddress($currentUserId);
            
            if (!$userAddress) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'No address found for current user'
                ]);
                return;
            }
            
            //formatare adresa ca string
            $addressString = '';
            if ($userAddress['street']) $addressString .= $userAddress['street'] . ', ';
            if ($userAddress['city']) $addressString .= $userAddress['city'] . ', ';
            if ($userAddress['county']) $addressString .= $userAddress['county'] . ', ';
            if ($userAddress['country']) $addressString .= $userAddress['country'];
            if ($userAddress['postal_code']) $addressString .= ', ' . $userAddress['postal_code'];
            
            $addressString = rtrim($addressString, ', '); 
            
            $coordinates = $this->geocodeAddress($userAddress);
            
            if ($coordinates) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'location' => $coordinates,
                    'address' => $addressString,
                    'address_details' => $userAddress
                ]);
            } else {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Could not geocode user address'
                ]);
            }
            
        } catch (Exception $e) {
            error_log("MapController::getCurrentUserLocation - Error: " . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to get user location'
            ]);
        }
    }
}
?>
