<?php
require_once __DIR__ . '/../config/db.php';

class UserAddressModel {
    private $pdo;

    public function __construct() {
        $this->pdo = getDbConnection();
    }     //obtine adresa utilizatorului
        public function getAddressByUserId($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT address_id, user_id, country, county, city, street, postal_code 
                FROM user_addresses 
                WHERE user_id = :user_id
            ");
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Error getting user address: ' . $e->getMessage());
            throw new Exception('Failed to get address: ' . $e->getMessage());
        }    }

    //insereaza o noua adresa pt user
    public function insertAddress($userId, $addressData) {
        try {
            
            $stmt = $this->pdo->prepare("
                INSERT INTO user_addresses (user_id, country, county, city, street, postal_code) 
                VALUES (:user_id, :country, :county, :city, :street, :postal_code)
            ");
            
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':country', $addressData['country'], PDO::PARAM_STR);
            $stmt->bindParam(':county', $addressData['county'], PDO::PARAM_STR);
            $stmt->bindParam(':city', $addressData['city'], PDO::PARAM_STR);
            $stmt->bindParam(':street', $addressData['street'], PDO::PARAM_STR);
            $stmt->bindParam(':postal_code', $addressData['postal_code'], PDO::PARAM_STR);
            
            $stmt->execute();
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log('Error inserting address: ' . $e->getMessage());
            throw new Exception('Failed to insert address: ' . $e->getMessage());
        }
    }    
    
    //actualizeaza adresa
    public function updateAddress($userId, $addressData) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE user_addresses 
                SET country = :country, county = :county, city = :city, 
                    street = :street, postal_code = :postal_code 
                WHERE user_id = :user_id
            ");
            
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':country', $addressData['country'], PDO::PARAM_STR);
            $stmt->bindParam(':county', $addressData['county'], PDO::PARAM_STR);
            $stmt->bindParam(':city', $addressData['city'], PDO::PARAM_STR);
            $stmt->bindParam(':street', $addressData['street'], PDO::PARAM_STR);
            $stmt->bindParam(':postal_code', $addressData['postal_code'], PDO::PARAM_STR);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error updating address: ' . $e->getMessage());
            throw new Exception('Failed to update address: ' . $e->getMessage());
        }
    }

    //insereaza/actualizeaza adresa utilizatorului
    public function upsertAddress($userId, $addressData) {
        //verifica daca are deja o adresa
        $existingAddress = $this->getAddressByUserId($userId);
        
        if ($existingAddress) {
        //actualizeaza adresa existenta
            return $this->updateAddress($userId, $addressData);
        } else {
        //insereaza o noua adresa
            return $this->insertAddress($userId, $addressData);
        }
    }

    //sterge adresa
    public function deleteAddress($userId) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM user_addresses WHERE user_id = :user_id");
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error deleting address: ' . $e->getMessage());
            throw new Exception('Failed to delete address');
        }
    }
}
