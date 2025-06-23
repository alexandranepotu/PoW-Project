<?php
require_once __DIR__ . '/../models/NewsModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';

class NewsController {
    
    public function getNews() {
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
    
    public function addNews() {
        try {
            // Check admin authentication
            $adminMiddleware = new AdminMiddleware();
            if (!$adminMiddleware->checkAdmin()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Admin access required'
                ]);
                return;
            }
            
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['title']) || !isset($input['content'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Title and content are required'
                ]);
                return;
            }
            
            $title = trim($input['title']);
            $content = trim($input['content']);
            
            if (empty($title) || empty($content)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Title and content cannot be empty'
                ]);
                return;
            }
            
            $model = new NewsModel();
            $result = $model->addNews($title, $content);
            
            if ($result) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'News article added successfully',
                    'id' => $result
                ]);
            } else {
                throw new Exception("Failed to add news article");
            }
            
        } catch (Exception $e) {
            error_log("Error in NewsController->addNews: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to add news: ' . $e->getMessage()
            ]);
        }
    }
    
    public function deleteNews($id) {
        try {
            // Check admin authentication
            $adminMiddleware = new AdminMiddleware();
            if (!$adminMiddleware->checkAdmin()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Admin access required'
                ]);
                return;
            }
            
            if (!$id || !is_numeric($id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Valid news ID is required'
                ]);
                return;
            }
            
            $model = new NewsModel();
            $result = $model->deleteNews($id);
            
            if ($result) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'News article deleted successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'News article not found'
                ]);
            }
            
        } catch (Exception $e) {
            error_log("Error in NewsController->deleteNews: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete news: ' . $e->getMessage()
            ]);
        }
    }
}
