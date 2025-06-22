<?php

// rute rss
if ($path === '/rss/feed' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/RssController.php';
    $controller = new RssController();
    $controller->generateFeed();
    exit;
}
