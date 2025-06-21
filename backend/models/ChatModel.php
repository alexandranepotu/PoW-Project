<?php
class ChatModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAnimalOwner($animalId) {
        $stmt = $this->pdo->prepare("SELECT added_by FROM animals WHERE animal_id = ?");
        $stmt->execute([$animalId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findExistingChatRoom($animalId, $interestedUserId, $ownerId) {
        $stmt = $this->pdo->prepare("
            SELECT room_id FROM chat_rooms 
            WHERE animal_id = ? AND interested_user_id = ? AND owner_id = ?
        ");
        $stmt->execute([$animalId, $interestedUserId, $ownerId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createChatRoom($animalId, $interestedUserId, $ownerId) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO chat_rooms (animal_id, interested_user_id, owner_id) 
                VALUES (?, ?, ?) 
                ON CONFLICT (animal_id, interested_user_id, owner_id) 
                DO UPDATE SET status = 'active'
                RETURNING room_id
            ");
            $stmt->execute([$animalId, $interestedUserId, $ownerId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'ON CONFLICT') !== false) {
                $stmt = $this->pdo->prepare("
                    INSERT INTO chat_rooms (animal_id, interested_user_id, owner_id) 
                    VALUES (?, ?, ?) 
                    RETURNING room_id
                ");
                $stmt->execute([$animalId, $interestedUserId, $ownerId]);
                return $stmt->fetch(PDO::FETCH_ASSOC);
            } else {
                throw $e;
            }
        }
    }

    public function isUserAuthorizedForRoom($roomId, $userId) {
        $stmt = $this->pdo->prepare("
            SELECT room_id FROM chat_rooms 
            WHERE room_id = ? AND (interested_user_id = ? OR owner_id = ?)
        ");
        $stmt->execute([$roomId, $userId, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function addMessage($roomId, $senderId, $message) {
        $stmt = $this->pdo->prepare("
            INSERT INTO chat_messages (room_id, sender_id, message) 
            VALUES (?, ?, ?) 
            RETURNING message_id, sent_at
        ");
        $stmt->execute([$roomId, $senderId, $message]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function getMessages($roomId) {
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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function getChatRoomInfo($roomId) {
        $stmt = $this->pdo->prepare("
            SELECT room_id, animal_id, interested_user_id, owner_id 
            FROM chat_rooms 
            WHERE room_id = ?
        ");
        $stmt->execute([$roomId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function markMessagesAsRead($roomId, $userId) {
        $stmt = $this->pdo->prepare("
            UPDATE chat_messages 
            SET status = 'read', read_at = CURRENT_TIMESTAMP
            WHERE room_id = ? AND sender_id != ? AND status != 'read'
        ");
        $stmt->execute([$roomId, $userId]);
        return $stmt->rowCount();
    }

    public function getUserConversations($userId) {
        $stmt = $this->pdo->prepare("
            SELECT 
                cr.room_id,
                cr.animal_id,
                a.name as animal_name,
                cr.interested_user_id,
                cr.owner_id,
                interested.username as interested_user_name,
                owner.username as owner_name,
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
                ) as last_message,
                (
                    SELECT sent_at
                    FROM chat_messages
                    WHERE room_id = cr.room_id
                    ORDER BY sent_at DESC
                    LIMIT 1
                ) as last_message_time
            FROM chat_rooms cr
            JOIN animals a ON cr.animal_id = a.animal_id
            JOIN users owner ON cr.owner_id = owner.user_id
            JOIN users interested ON cr.interested_user_id = interested.user_id
            WHERE (cr.owner_id = ? OR cr.interested_user_id = ?)
            AND EXISTS (
                SELECT 1 FROM chat_messages cm WHERE cm.room_id = cr.room_id
            )
            ORDER BY (
                SELECT sent_at
                FROM chat_messages
                WHERE room_id = cr.room_id
                ORDER BY sent_at DESC
                LIMIT 1
            ) DESC NULLS LAST
        ");
        $stmt->execute([$userId, $userId, $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
