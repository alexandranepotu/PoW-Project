<?php
require_once __DIR__ . '/../config/db.php';

class NewsModel {
    private $conn;

    public function __construct() {
        $this->conn = getDbConnection();
    }

    public function getLatestNews($limit = 10) {
        $stmt = $this->conn->prepare("SELECT * FROM news ORDER BY created_at DESC LIMIT :limit");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $news;
    }
}
