<?php
require_once __DIR__ . '/../config/db.php';

class ChatController {
    private $pdo;

    public function __construct($pdo = null) {
        if ($pdo === null) {
            $this->pdo = getDbConnection();
        } else {
            $this->pdo = $pdo;
        }
    }

    public function createChatRoom($animalId, $interestedUserId) {
        try {
            //verif daca chat room ul deja exista
            $stmt = $this->pdo->prepare("
                SELECT room_id FROM chat_rooms 
                WHERE animal_id = ? AND interested_user_id = ?
            ");
            $stmt->execute([$animalId, $interestedUserId]);
            $existingRoom = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingRoom) {
                return ['success' => true, 'room_id' => $existingRoom['room_id']];
            }

            //iau id la owner ul animalului
            $stmt = $this->pdo->prepare("SELECT added_by FROM animals WHERE animal_id = ?");
            $stmt->execute([$animalId]);
            $animal = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$animal) {
                throw new Exception("Animal not found");
            }

            //chat room nou
            $stmt = $this->pdo->prepare("
                INSERT INTO chat_rooms (animal_id, interested_user_id, owner_id) 
                VALUES (?, ?, ?) 
                RETURNING room_id
            ");
            $stmt->execute([$animalId, $interestedUserId, $animal['added_by']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return ['success' => true, 'room_id' => $result['room_id']];
        } catch (Exception $e) {
            error_log("Error creating chat room: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    public function sendMessage($roomId, $senderId, $message) {
        try {
            //verif daca senderul este parte din chat room
            $stmt = $this->pdo->prepare("
                SELECT room_id FROM chat_rooms 
                WHERE room_id = ? AND (interested_user_id = ? OR owner_id = ?)
            ");
            $stmt->execute([$roomId, $senderId, $senderId]);
            if (!$stmt->fetch()) {
                throw new Exception("User not authorized for this chat room");
            }

            //trim mesajul
            $stmt = $this->pdo->prepare("
                INSERT INTO chat_messages (room_id, sender_id, message) 
                VALUES (?, ?, ?) 
                RETURNING message_id, sent_at
            ");
            $stmt->execute([$roomId, $senderId, $message]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'message_id' => $result['message_id'],
                'sent_at' => $result['sent_at']
            ];
        } catch (Exception $e) {
            error_log("Error sending message: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    public function getMessages($roomId, $userId) {
        try {
            //verif daca userul este parte din chat room
            $stmt = $this->pdo->prepare("
                SELECT room_id, animal_id FROM chat_rooms 
                WHERE room_id = ? AND (interested_user_id = ? OR owner_id = ?)
            ");
            $stmt->execute([$roomId, $userId, $userId]);
            $room = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$room) {
                throw new Exception("User not authorized for this chat room");
            }

            //iau msj
            $stmt = $this->pdo->prepare("
                SELECT 
                    cm.message_id,
                    cm.sender_id,
                    u.username as sender_name,
                    cm.message,
                    cm.sent_at,
                    cm.read_at,
                    cm.status
                FROM chat_messages cm
                JOIN users u ON cm.sender_id = u.user_id
                WHERE cm.room_id = ?
                ORDER BY cm.sent_at ASC
            ");
            $stmt->execute([$roomId]);
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            //le marchez ca citite
            $stmt = $this->pdo->prepare("
                UPDATE chat_messages 
                SET status = 'read', read_at = CURRENT_TIMESTAMP
                WHERE room_id = ? AND sender_id != ? AND status != 'read'
            ");
            $stmt->execute([$roomId, $userId]);

            return ['success' => true, 'messages' => $messages, 'animal_id' => $room['animal_id']];
        } catch (Exception $e) {
            error_log("Error fetching messages: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    public function getUserChats($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    cr.room_id,
                    cr.animal_id,
                    a.name as animal_name,
                    CASE 
                        WHEN cr.interested_user_id = ? THEN owner.username
                        ELSE interested.username
                    END as other_user_name,
                    CASE 
                        WHEN cr.interested_user_id = ? THEN owner.user_id
                        ELSE interested.user_id
                    END as other_user_id,
                    cr.created_at,
                    cr.status,
                    (
                        SELECT COUNT(*)
                        FROM chat_messages cm
                        WHERE cm.room_id = cr.room_id
                        AND cm.sender_id != ?
                        AND cm.status != 'read'
                    ) as unread_count,
                    (
                        SELECT message
                        FROM chat_messages
                        WHERE room_id = cr.room_id
                        ORDER BY sent_at DESC
                        LIMIT 1
                    ) as last_message
                FROM chat_rooms cr
                JOIN animals a ON cr.animal_id = a.animal_id
                JOIN users owner ON cr.owner_id = owner.user_id
                JOIN users interested ON cr.interested_user_id = interested.user_id
                WHERE cr.owner_id = ? OR cr.interested_user_id = ?
                ORDER BY (
                    SELECT sent_at
                    FROM chat_messages
                    WHERE room_id = cr.room_id
                    ORDER BY sent_at DESC
                    LIMIT 1
                ) DESC NULLS LAST
            ");
            $stmt->execute([$userId, $userId, $userId, $userId, $userId]);
            $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['success' => true, 'chats' => $chats];
        } catch (Exception $e) {
            error_log("Error fetching user chats: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
}
