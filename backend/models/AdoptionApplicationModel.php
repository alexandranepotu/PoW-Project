<?php
require_once __DIR__ . '/../config/db.php';

class AdoptionApplicationModel {
    private $db;
    public function __construct($db) {
        $this->db = $db;
    }

    public function submitApplication($pet_id, $applicant_id, $owner_id, $answers) {
        $stmt = $this->db->prepare('INSERT INTO adoption_applications (pet_id, applicant_id, owner_id, answers) VALUES (?, ?, ?, ?)');
        return $stmt->execute([$pet_id, $applicant_id, $owner_id, json_encode($answers)]);
    }

    public function getSubmittedApplications($applicant_id) {
        $stmt = $this->db->prepare('SELECT * FROM adoption_applications WHERE applicant_id = ? ORDER BY created_at DESC');
        $stmt->execute([$applicant_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getReceivedApplications($owner_id) {
        $stmt = $this->db->prepare('SELECT * FROM adoption_applications WHERE owner_id = ? ORDER BY created_at DESC');
        $stmt->execute([$owner_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getApplicationById($application_id) {
        $stmt = $this->db->prepare('SELECT * FROM adoption_applications WHERE application_id = ?');
        $stmt->execute([$application_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($application_id, $status, $response_message = null) {
        $stmt = $this->db->prepare('UPDATE adoption_applications SET status = ?, response_message = ?, updated_at = CURRENT_TIMESTAMP WHERE application_id = ?');
        return $stmt->execute([$status, $response_message, $application_id]);
    }

    public function rejectOtherApplicationsForPet($pet_id, $accepted_application_id) {
        $stmt = $this->db->prepare('UPDATE adoption_applications SET status = ?, response_message = ?, updated_at = CURRENT_TIMESTAMP WHERE pet_id = ? AND application_id != ? AND status = ?');
        return $stmt->execute(['rejected', 'Pet was adopted by another applicant', $pet_id, $accepted_application_id, 'pending']);
    }

    public function getDb() {
        return $this->db;
    }
}
