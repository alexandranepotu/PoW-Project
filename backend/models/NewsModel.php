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
            error_log("Total news items: " . $total);

            //ultimele stiri
            $stmt = $this->conn->prepare(
                "SELECT n.*, u.username as author_name 
                FROM news n 
                LEFT JOIN users u ON n.user_id = u.user_id 
                ORDER BY n.created_at DESC 
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
}
