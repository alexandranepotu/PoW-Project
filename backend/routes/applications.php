<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AdoptionApplicationController.php';

$controller = new AdoptionApplicationController($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

//normalizez path ul
$basePath = '/PoW-Project/backend/public';
$path = parse_url($uri, PHP_URL_PATH);
if (str_starts_with($path, $basePath)) {    $path = substr($path, strlen($basePath));
}

if ($method === 'POST' && preg_match('#^/api/applications$#', $path)) {
    $data = json_decode(file_get_contents('php://input'), true);
    $controller->submitApplication($data);
    exit;
} 
if ($method === 'GET' && preg_match('#^/api/applications/submitted$#', $path)) {
    // ?user_id=123
    $applicant_id = $_GET['user_id'] ?? null;
    if ($applicant_id) $controller->getSubmittedApplications($applicant_id);
    else { http_response_code(400); echo json_encode(['error' => 'Missing user_id']); }
    exit;
}
if ($method === 'GET' && preg_match('#^/api/applications/received$#', $path)) {
    // ?user_id=123
    $owner_id = $_GET['user_id'] ?? null;
    if ($owner_id) $controller->getReceivedApplications($owner_id);
    else { http_response_code(400); echo json_encode(['error' => 'Missing user_id']); }
    exit;
}
if ($method === 'GET' && preg_match('#^/api/applications/([0-9]+)$#', $path, $matches)) {
    $controller->getApplicationById($matches[1]);
    exit;
}
if ($method === 'POST' && preg_match('#^/api/applications/([0-9]+)/status$#', $path, $matches)) {
    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? null;
    $response_message = $data['response_message'] ?? null;
    if ($status) $controller->updateStatus($matches[1], $status, $response_message);
    else { http_response_code(400); echo json_encode(['error' => 'Missing status']); }
    exit;
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
