<?php
require_once __DIR__ . '/../models/ChatModel.php';
require_once __DIR__ . '/../config/db.php';

class ChatController {
    private $chatModel;

    public function __construct($pdo = null) {
        if ($pdo === null) {
            $pdo = getDbConnection();
        }
        $this->chatModel = new ChatModel($pdo);
    }    public function createChatRoom($animalId, $interestedUserId) {
        try {
            // Obține owner-ul animalului din model
            $animal = $this->chatModel->getAnimalOwner($animalId);

            if (!$animal) {
                throw new Exception("Animal not found");
            }

            $ownerId = $animal['added_by'];

            // pt a nu avea chat cu el insusi
            if ($interestedUserId == $ownerId) {
                return ['error' => 'You cannot create a chat room for your own pet'];
            }

            //verficare daca exista char room
            $existingRoom = $this->chatModel->findExistingChatRoom($animalId, $interestedUserId, $ownerId);

            if ($existingRoom) {
                return ['success' => true, 'room_id' => $existingRoom['room_id'], 'message' => 'Chat room already exists'];
            }

            // creeaza chat room->model
            $result = $this->chatModel->createChatRoom($animalId, $interestedUserId, $ownerId);

            return ['success' => true, 'room_id' => $result['room_id'], 'message' => 'Chat room created successfully'];

        } catch (Exception $e) {
            error_log("Error creating chat room: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }    public function sendMessage($roomId, $senderId, $message) {
        try {
            // verifica daca senderul este autoroizat pentru acest chat room
            if (!$this->chatModel->isUserAuthorizedForRoom($roomId, $senderId)) {
                throw new Exception("User not authorized for this chat room");
            }

            //trimite mesaj->model
            $result = $this->chatModel->addMessage($roomId, $senderId, $message);

            return [
                'success' => true,
                'message_id' => $result['message_id'],
                'sent_at' => $result['sent_at']
            ];
        } catch (Exception $e) {
            error_log("Error sending message: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }    public function getMessages($roomId, $userId) {
        try {
            // verifica dacă userukl este autorizat pentru acest chat room
            if (!$this->chatModel->isUserAuthorizedForRoom($roomId, $userId)) {
                throw new Exception("User not authorized for this chat room");
            }

            $room = $this->chatModel->getChatRoomInfo($roomId);
            
            if (!$room) {
                throw new Exception("Chat room not found");
            }

            $messages = $this->chatModel->getMessages($roomId);

            // marcheaza mesajele ca citite
            $this->chatModel->markMessagesAsRead($roomId, $userId);

            return ['success' => true, 'messages' => $messages, 'animal_id' => $room['animal_id']];
        } catch (Exception $e) {
            error_log("Error fetching messages: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }    public function getUserChats($userId) {
        try {
            $conversations = $this->chatModel->getUserConversations($userId);
            
            return ['success' => true, 'chats' => $conversations];
        } catch (Exception $e) {
            error_log("Error fetching user chats: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }public function getUserConversations($userId) {
        try {
            $conversations = $this->chatModel->getUserConversations($userId);
            
            return [
                'success' => true,
                'conversations' => $conversations,
                'current_user_id' => $userId
            ];
            
        } catch (Exception $e) {
            error_log("Error getting user conversations: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    public function markMessagesAsRead($roomId, $userId) {
        try {
            if (!$this->chatModel->isUserAuthorizedForRoom($roomId, $userId)) {
                throw new Exception("User not authorized for this chat room");
            }

            $this->chatModel->markMessagesAsRead($roomId, $userId);
            
            return ['success' => true];
            
        } catch (Exception $e) {
            error_log("Error marking messages as read: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
}
