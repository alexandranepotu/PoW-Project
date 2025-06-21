<?php
class AdminModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAllUsersWithStats() {
        $sql = "SELECT 
                u.user_id,
                u.username,
                u.email,
                u.full_name,
                u.created_at,
                u.phone,
                u.is_admin::boolean,
                COUNT(DISTINCT a.animal_id) as total_pets,
                (
                    SELECT COUNT(*) 
                    FROM adoption_applications aa 
                    WHERE aa.applicant_id = u.user_id
                ) as applications_sent,
                (
                    SELECT COUNT(*) 
                    FROM adoption_applications aa2 
                    JOIN animals a2 ON aa2.pet_id = a2.animal_id 
                    WHERE a2.added_by = u.user_id
                ) as applications_received,
                (
                    SELECT COUNT(*) 
                    FROM chat_rooms cr 
                    WHERE cr.interested_user_id = u.user_id OR cr.owner_id = u.user_id
                ) as chat_rooms_count
            FROM users u
            LEFT JOIN animals a ON u.user_id = a.added_by
            GROUP BY u.user_id, u.username, u.email, u.full_name, u.created_at, u.phone, u.is_admin
            ORDER BY u.created_at DESC";
            
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function getAllAnimalsWithOwners() {
        $sql = "SELECT 
                a.animal_id,
                a.name as animal_name,
                a.species,
                a.breed,
                a.age,
                a.sex,
                a.health_status,
                a.available::boolean,
                a.created_at,
                u.username as owner_username,
                u.full_name as owner_name,
                u.email as owner_email,
                (
                    SELECT COUNT(*) 
                    FROM adoption_applications aa 
                    WHERE aa.pet_id = a.animal_id
                ) as applications_count
            FROM animals a
            JOIN users u ON a.added_by = u.user_id
            ORDER BY a.created_at DESC";
            
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllApplicationsWithDetails() {
        $sql = "SELECT 
                aa.application_id,
                aa.status,
                aa.created_at,
                aa.updated_at,
                aa.response_message,
                a.name as pet_name,
                a.species,
                a.breed,
                applicant.username as applicant_username,
                applicant.full_name as applicant_name,
                applicant.email as applicant_email,
                owner.username as owner_username,
                owner.full_name as owner_name,
                owner.email as owner_email
            FROM adoption_applications aa
            JOIN animals a ON aa.pet_id = a.animal_id
            JOIN users applicant ON aa.applicant_id = applicant.user_id
            JOIN users owner ON aa.owner_id = owner.user_id
            ORDER BY aa.created_at DESC";
            
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getDashboardStats() {
        $stats = [];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM users");
        $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM animals");
        $stats['total_animals'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM animals WHERE available = TRUE");
        $stats['available_animals'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM adoption_applications");
        $stats['total_applications'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM adoption_applications WHERE status = 'pending'");
        $stats['pending_applications'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM chat_rooms");
        $stats['total_chat_rooms'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'");
        $stats['new_users_week'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        return $stats;
    }

    public function deleteUser($userId) {
        try {
            $this->pdo->beginTransaction();
            
            $stmt = $this->pdo->prepare("DELETE FROM adoption_applications WHERE applicant_id = ? OR owner_id = ?");
            $stmt->execute([$userId, $userId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM chat_messages WHERE sender_id = ?");
            $stmt->execute([$userId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM chat_rooms WHERE interested_user_id = ? OR owner_id = ?");
            $stmt->execute([$userId, $userId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM animals WHERE added_by = ?");
            $stmt->execute([$userId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM user_addresses WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM users WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            $this->pdo->commit();
            return true;
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function updateUserAdminStatus($userId, $isAdmin) {
        $stmt = $this->pdo->prepare("UPDATE users SET is_admin = ? WHERE user_id = ?");
        return $stmt->execute([$isAdmin, $userId]);
    }
    public function deleteAnimal($animalId) {
        try {
            $this->pdo->beginTransaction();
            
            $stmt = $this->pdo->prepare("DELETE FROM adoption_applications WHERE pet_id = ?");
            $stmt->execute([$animalId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM chat_rooms WHERE animal_id = ?");
            $stmt->execute([$animalId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM media_resources WHERE animal_id = ?");
            $stmt->execute([$animalId]);
            
            $stmt = $this->pdo->prepare("DELETE FROM animals WHERE animal_id = ?");
            $stmt->execute([$animalId]);
            
            $this->pdo->commit();
            return true;
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
?>
