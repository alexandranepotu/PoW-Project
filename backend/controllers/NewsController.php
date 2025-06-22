<?php
require_once __DIR__ . '/../models/NewsModel.php';

class NewsController {    public function getNews() {
        try {
            $model = new NewsModel();
            $news = $model->getLatestNews();
            
            if ($news === false) {
                throw new Exception("Failed to fetch news");
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'news' => $news,
                'count' => count($news)
            ]);
        } catch (Exception $e) {
            error_log("Error in NewsController->getNews: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch news: ' . $e->getMessage()
            ]);
        }
    }
}
