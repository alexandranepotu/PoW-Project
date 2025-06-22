<?php
require_once __DIR__ . '/../controllers/ChatController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$chatController = new ChatController();

// Verifica autentificarea prin JWT
$user = AuthMiddleware::getAuthenticatedUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated']);
    exit;
}

$userId = $user->user_id;

//extrage path relativ din URL
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path variations to get clean path
$basePaths = [
    '/PoW-Project/backend/public',
    '/PoW-Project',
    ''
];

foreach ($basePaths as $basePath) {
    if (str_starts_with($requestPath, $basePath)) {
        $requestPath = substr($requestPath, strlen($basePath));
        break;
    }
}

// Ensure path starts with /api/chat
if (!str_starts_with($requestPath, '/api/chat')) {
    $requestPath = '/api/chat' . $requestPath;
}

$method = $_SERVER['REQUEST_METHOD'];

error_log("Chat route handling: $method $requestPath");
error_log("Original REQUEST_URI: " . $_SERVER['REQUEST_URI']);
error_log("JWT user_id: " . $userId);
error_log("Checking route condition: method='$method', path='$requestPath'");
error_log("Path comparison result: " . ($requestPath === '/api/chat/conversations' ? 'MATCH' : 'NO MATCH'));

// Get user conversations for inbox
if ($method === 'GET' && $requestPath === '/api/chat/conversations') {
    error_log("Getting conversations for user $userId");
    $result = $chatController->getUserConversations($userId);
    echo json_encode($result);
    exit; // Add explicit exit
}

// Mark messages as read
elseif ($method === 'POST' && preg_match('#/api/chat/mark-read/(\d+)#', $requestPath, $matches)) {
    $roomId = $matches[1];
    error_log("Marking messages as read in room $roomId for user $userId");
    $result = $chatController->markMessagesAsRead($roomId, $userId);
    echo json_encode($result);
    exit;
}

//creeeaza sau ia chat room existent
if ($method === 'POST' && preg_match('#/api/chat/room/(\d+)#', $requestPath, $matches)) {
    $animalId = $matches[1];
    error_log("Creating chat room for animal $animalId by user $userId");
    echo json_encode($chatController->createChatRoom($animalId, $userId));
    exit;
}

//trimite un msj - endpoint principal pentru frontend
elseif ($method === 'POST' && $requestPath === '/api/chat/send') {
    $data = json_decode(file_get_contents('php://input'), true);
    $roomId = $data['room_id'] ?? null;
    $message = $data['message'] ?? null;
    
    if (!$roomId || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing room_id or message']);
        exit;
    }
    
    error_log("Sending message in room $roomId by user $userId");
    echo json_encode($chatController->sendMessage($roomId, $userId, $message));
    exit;
}

//trimite un msj - endpoint alternatif
elseif ($method === 'POST' && preg_match('#/api/chat/(\d+)/message#', $requestPath, $matches)) {
    $roomId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    error_log("Sending message in room $roomId by user $userId");
    echo json_encode($chatController->sendMessage($roomId, $userId, $data['message']));
    exit;
}

//ia msj pentru un chat room
else if ($method === 'GET' && preg_match('#/api/chat/(\d+)/messages#', $requestPath, $matches)) {
    $roomId = $matches[1];
    error_log("Fetching messages for room $roomId by user $userId");
    echo json_encode($chatController->getMessages($roomId, $userId));
    exit;
}

//ia chaturile pentru un user
else if ($method === 'GET' && preg_match('#/api/chat/rooms#', $requestPath)) {
    error_log("Fetching chat rooms for user $userId");
    echo json_encode($chatController->getUserChats($userId));
    exit;
}

//fara ruta
else {
    http_response_code(404);
    error_log("No matching chat route for: $method $requestPath");
    echo json_encode(['error' => 'Chat endpoint not found']);
    exit;
}
