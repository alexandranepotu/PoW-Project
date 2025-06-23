<?php
require_once __DIR__ . '/../config/db.php';

class NewsModel {
    private $conn;

    public function __construct() {
        $this->conn = getDbConnection();
    }    public function getLatestNews($limit = 10) {
        try {
            //verif daca exista tabela news
            $tableCheck = $this->conn->query("SELECT to_regclass('public.news')");
            $exists = $tableCheck->fetch(PDO::FETCH_COLUMN);
            
            if (!$exists) {
                error_log("News table does not exist");
                return [];
            }

            //iau count ul total
            $countStmt = $this->conn->query("SELECT COUNT(*) FROM news");
            $total = $countStmt->fetch(PDO::FETCH_COLUMN);
            error_log("Total news items: " . $total);            //ultimele stiri
            $stmt = $this->conn->prepare(
                "SELECT id as news_id, title, content, created_at, 
                        NULL as author_name, NULL as user_id
                FROM news 
                ORDER BY created_at DESC 
                LIMIT :limit"
            );
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Retrieved " . count($news) . " news items");
            return $news;
        } catch (PDOException $e) {
            error_log("Error fetching news: " . $e->getMessage());
            return [];
        }
    }
    
    public function addNews($title, $content) {
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO news (title, content, created_at) 
                VALUES (:title, :content, NOW()) 
                RETURNING id"
            );
            $stmt->bindValue(':title', $title, PDO::PARAM_STR);
            $stmt->bindValue(':content', $content, PDO::PARAM_STR);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['id'] : false;
        } catch (PDOException $e) {
            error_log("Error adding news: " . $e->getMessage());
            return false;
        }
    }
    
    public function deleteNews($id) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM news WHERE id = :id");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error deleting news: " . $e->getMessage());
            return false;
        }
    }
    
    public function getNewsById($id) {
        try {
            $stmt = $this->conn->prepare(
                "SELECT id, title, content, created_at 
                FROM news 
                WHERE id = :id"
            );
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching news by ID: " . $e->getMessage());
            return false;
        }
    }
}
