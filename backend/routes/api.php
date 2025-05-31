<?php
//preia adresa ceruta de client si metoda HTTP
$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

if ($uri === '/api/register' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
?>