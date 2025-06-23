<?php

// rute rss
if ($path === '/rss/feed' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/RssController.php';
    $controller = new RssController();
    $controller->generateFeed();
    exit;
}

// ruta pentru RSS filtrat pe zone geografice/rase/criterii
if ($path === '/rss/filtered' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/RssController.php';
    $controller = new RssController();
    $controller->generateFilteredFeed();
    exit;
}
