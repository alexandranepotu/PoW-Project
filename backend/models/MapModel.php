<?php
class MapModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getUsersLocations($currentUserId = null) {
        $whereClause = "ua.city IS NOT NULL AND ua.country IS NOT NULL";
        $params = [];
        
        if ($currentUserId) {
            $whereClause .= " AND u.user_id != ?";
            $params[] = $currentUserId;
        }
        
        $sql = "SELECT DISTINCT
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
            ORDER BY u.user_id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }    public function getUserAnimals($userId) {
        $sql = "SELECT 
                animal_id,
                name,
                species,
                breed,
                age,
                sex,
                health_status,
                available,
                description
            FROM animals 
            WHERE added_by = ? AND available = TRUE
            ORDER BY name";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserAddress($userId) {
        $sql = "SELECT 
                country,
                county,
                city,
                street,
                postal_code
            FROM user_addresses 
            WHERE user_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function searchUsersByLocation($searchTerm) {
        $sql = "SELECT DISTINCT
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
            WHERE (ua.city ILIKE ? OR ua.county ILIKE ?)
            AND ua.city IS NOT NULL AND ua.country IS NOT NULL
            GROUP BY u.user_id, u.full_name, u.username, ua.country, ua.county, ua.city, ua.street, ua.postal_code
            ORDER BY u.user_id";
        
        $searchPattern = "%{$searchTerm}%";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$searchPattern, $searchPattern]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllCities() {
        $sql = "SELECT DISTINCT city, county, country 
                FROM user_addresses 
                WHERE city IS NOT NULL 
                ORDER BY country, county, city";
        
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUsersByCity($city, $currentUserId = null) {
        $whereClause = "ua.city = ?";
        $params = [$city];
        
        if ($currentUserId) {
            $whereClause .= " AND u.user_id != ?";
            $params[] = $currentUserId;
        }
        
        $sql = "SELECT DISTINCT
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
            ORDER BY u.full_name";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
