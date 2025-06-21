<?php
require_once __DIR__ . '/../controllers/ChatController.php';

$chatController = new ChatController();

//verif daca userul e autentificat
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}

//extrage path relativ din URL
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (strpos($requestPath, '/api/chat/') === false) {
    $requestPath = '/api/chat' . $requestPath;
}
$method = $_SERVER['REQUEST_METHOD'];

error_log("Chat route handling: $method $requestPath");
error_log("Session user_id: " . ($_SESSION['user_id'] ?? 'not set'));

//creeeaza sau ia chat room existent
if ($method === 'POST' && preg_match('#/api/chat/room/(\d+)#', $requestPath, $matches)) {
    $animalId = $matches[1];
    $interestedUserId = $_SESSION['user_id'];
    error_log("Creating chat room for animal $animalId by user $interestedUserId");
    echo json_encode($chatController->createChatRoom($animalId, $interestedUserId));
}

//trimite un msj
else if ($method === 'POST' && preg_match('#/api/chat/(\d+)/message#', $requestPath, $matches)) {
    $roomId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $senderId = $_SESSION['user_id'];
    error_log("Sending message in room $roomId by user $senderId");
    echo json_encode($chatController->sendMessage($roomId, $senderId, $data['message']));
}

//ia msj pentru un chat room
else if ($method === 'GET' && preg_match('#/api/chat/(\d+)/messages#', $requestPath, $matches)) {
    $roomId = $matches[1];
    $userId = $_SESSION['user_id'];
    error_log("Fetching messages for room $roomId by user $userId");
    echo json_encode($chatController->getMessages($roomId, $userId));
}

//ia chaturile pentru un user
else if ($method === 'GET' && preg_match('#/api/chat/rooms#', $requestPath)) {
    $userId = $_SESSION['user_id'];
    error_log("Fetching chat rooms for user $userId");
    echo json_encode($chatController->getUserChats($userId));
}

//fara ruta
else {
    http_response_code(404);
    error_log("No matching chat route for: $method $requestPath");
    echo json_encode(['error' => 'Chat endpoint not found']);
    exit;
}
