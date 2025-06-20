<?php

require_once __DIR__ . '/../models/AdoptionApplicationModel.php';
require_once __DIR__ . '/../config/db.php';

class AdoptionApplicationController {
    private $model;
    public function __construct($db) {
        $this->model = new AdoptionApplicationModel($db);
    }

    public function submitApplication($data) {
        if (!isset($data['pet_id'], $data['applicant_id'], $data['owner_id'], $data['answers'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        $result = $this->model->submitApplication($data['pet_id'], $data['applicant_id'], $data['owner_id'], $data['answers']);
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to submit application']);
        }
    }

    public function getSubmittedApplications($applicant_id) {
        $apps = $this->model->getSubmittedApplications($applicant_id);
        echo json_encode($apps);
    }

    public function getReceivedApplications($owner_id) {
        $apps = $this->model->getReceivedApplications($owner_id);
        echo json_encode($apps);
    }

    public function getApplicationById($application_id) {
        $app = $this->model->getApplicationById($application_id);
        if (!$app) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found']);
            return;
        }
        //decodez rasp din json
        if (isset($app['answers']) && is_string($app['answers'])) {
            $decoded = json_decode($app['answers'], true);
            $app['answers'] = is_array($decoded) ? $decoded : [];
        }
        //detaliile animalului
        require_once __DIR__ . '/../models/PetPageModel.php';
        $petModel = new PetPageModel();
        $petArr = $petModel->getAnimals(['id' => $app['pet_id']]);
        $pet = is_array($petArr) && count($petArr) > 0 ? $petArr[0] : null;
        //detaliile aplicantului si ale proprietarului
        require_once __DIR__ . '/../models/User.php';
        $userModel = new User($this->model->getDb());
        $applicant = $userModel->findById($app['applicant_id']);
        $owner = $userModel->findById($app['owner_id']);
        //id ul de user in loc de user_id
        if ($owner && isset($owner['user_id'])) {
            $owner['id'] = (string)$owner['user_id'];
        }
        if ($applicant && isset($applicant['user_id'])) {
            $applicant['id'] = (string)$applicant['user_id'];
        }
        echo json_encode([
            'application' => $app,
            'pet' => $pet,
            'applicant' => $applicant,
            'owner' => $owner
        ]);
    }

    public function updateStatus($application_id, $status, $response_message = null) {
        $result = $this->model->updateStatus($application_id, $status, $response_message);
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update status']);
        }
    }
}
