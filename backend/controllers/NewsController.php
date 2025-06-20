<?php
require_once __DIR__ . '/../models/NewsModel.php';

class NewsController {
    public function getNews() {
        $model = new NewsModel();
        $news = $model->getLatestNews();
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'news' => $news]);
    }
}
