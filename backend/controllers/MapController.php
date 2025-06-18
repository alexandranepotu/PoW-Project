<?php

class MapController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }    public function getUsersLocations() {
        try {           
            $currentUserId = $this->getCurrentUserId();
            
            //pt a verifica daca utilizatorul are adreasa
            $whereClause = "ua.city IS NOT NULL AND ua.country IS NOT NULL";
            $params = [];
            
            if ($currentUserId) {
                $whereClause .= " AND u.user_id != ?";
                $params[] = $currentUserId;
            }
            
            // toate adresele utilizatorilor cu animale, mai putin de la utilizatorul curent
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT
                    u.user_id,
                    u.full_name,
                    u.username,
                    ua.country,
                    ua.county,
                    ua.city,
                    ua.street,
                    ua.postal_code,
                    COUNT(a.animal_id) as pets_count
                FROM users u
                LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
                LEFT JOIN animals a ON u.user_id = a.added_by
                WHERE {$whereClause}
                GROUP BY u.user_id, u.full_name, u.username, ua.country, ua.county, ua.city, ua.street, ua.postal_code
                ORDER BY u.user_id
            ");
            
            $stmt->execute($params);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            //adauga coordonate in functie de adresa
            $usersWithCoords = [];
            foreach ($users as $user) {
                $coordinates = $this->geocodeAddress($user);
                if ($coordinates) {
                    $user['latitude'] = $coordinates['lat'];
                    $user['longitude'] = $coordinates['lng'];
                    $usersWithCoords[] = $user;
                }
            }

            header('Content-Type: application/json');
            echo json_encode($usersWithCoords);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch users locations: ' . $e->getMessage()]);
        }
    }

    public function getCurrentUserLocation() {
        try {
            //id utilizatorului curent din sesiune/JWT
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'User not authenticated']);
                return;
            }

            $stmt = $this->pdo->prepare("
                SELECT 
                    u.full_name,
                    u.username,
                    ua.country,
                    ua.county,
                    ua.city,
                    ua.street,
                    ua.postal_code,
                    COUNT(a.animal_id) as pets_count
                FROM users u
                LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
                LEFT JOIN animals a ON u.user_id = a.added_by
                WHERE u.user_id = ?
                GROUP BY u.user_id, u.full_name, u.username, ua.country, ua.county, ua.city, ua.street, ua.postal_code
            ");
            
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !$user['city']) {
                http_response_code(404);
                echo json_encode(['error' => 'User address not found']);
                return;
            }

            $coordinates = $this->geocodeAddress($user);
            if ($coordinates) {
                $user['latitude'] = $coordinates['lat'];
                $user['longitude'] = $coordinates['lng'];
            }

            header('Content-Type: application/json');
            echo json_encode($user);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch user location: ' . $e->getMessage()]);
        }
    }

    public function saveUserLocation() {
        try {
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['error' => 'User not authenticated']);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['latitude']) || !isset($input['longitude'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Latitude and longitude required']);
                return;
            }

            $latitude = (float)$input['latitude'];
            $longitude = (float)$input['longitude'];

            if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid coordinates']);
                return;
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO user_locations (user_id, latitude, longitude, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                updated_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([$userId, $latitude, $longitude]);

            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Location saved successfully']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save location: ' . $e->getMessage()]);
        }
    }

    private function geocodeAddress($addressData) {
        $addressParts = array_filter([
            $addressData['street'],
            $addressData['city'],
            $addressData['county'],
            $addressData['country']
        ]);
        
        $address = implode(', ', $addressParts);
        
        $url = 'https://nominatim.openstreetmap.org/search?format=json&q=' . urlencode($address) . '&limit=1';
        
        $context = stream_context_create([
            'http' => [
                'header' => 'User-Agent: PetAdoptionApp/1.0'
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response) {
            $data = json_decode($response, true);
            if (!empty($data) && isset($data[0]['lat'], $data[0]['lon'])) {
                return [
                    'lat' => (float)$data[0]['lat'],
                    'lng' => (float)$data[0]['lon']
                ];
            }
        }
        
        return $this->getApproximateCoordinates($addressData['city']);
    }

    private function getApproximateCoordinates($city) {
        $romanianCities = [
            'București' => ['lat' => 44.4268, 'lng' => 26.1025],
            'Bucharest' => ['lat' => 44.4268, 'lng' => 26.1025],
            'Cluj-Napoca' => ['lat' => 46.7712, 'lng' => 23.6236],
            'Cluj' => ['lat' => 46.7712, 'lng' => 23.6236],
            'Timișoara' => ['lat' => 45.7494, 'lng' => 21.2272],
            'Timisoara' => ['lat' => 45.7494, 'lng' => 21.2272],
            'Iași' => ['lat' => 47.1585, 'lng' => 27.6014],
            'Iasi' => ['lat' => 47.1585, 'lng' => 27.6014],
            'Constanța' => ['lat' => 44.1598, 'lng' => 28.6348],
            'Constanta' => ['lat' => 44.1598, 'lng' => 28.6348],
            'Craiova' => ['lat' => 44.3302, 'lng' => 23.7949],
            'Brașov' => ['lat' => 45.6427, 'lng' => 25.5887],
            'Brasov' => ['lat' => 45.6427, 'lng' => 25.5887],
            'Galați' => ['lat' => 45.4353, 'lng' => 28.0080],
            'Galati' => ['lat' => 45.4353, 'lng' => 28.0080],
            'Oradea' => ['lat' => 47.0465, 'lng' => 21.9189],
            'Ploiești' => ['lat' => 44.9408, 'lng' => 26.0266],
            'Ploiesti' => ['lat' => 44.9408, 'lng' => 26.0266]
        ];
        
        $cityLower = strtolower($city);
        foreach ($romanianCities as $name => $coords) {
            if (strtolower($name) === $cityLower) {
                return $coords;
            }
        }
        
        return ['lat' => 45.9432, 'lng' => 24.9668];
    }

    private function getCurrentUserId() {

        if (isset($_COOKIE['jwt_token'])) {
            require_once __DIR__ . '/../models/JwtManager.php';
            $jwtManager = new JwtManager();
            $payload = $jwtManager->validateToken($_COOKIE['jwt_token']);
            return $payload ? $payload['user_id'] : null;
        }
        
        session_start();
        return $_SESSION['user_id'] ?? null;
    }
}
