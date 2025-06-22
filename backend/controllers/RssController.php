<?php
require_once __DIR__ . '/../models/RssModel.php';

class RssController {
    private $rssModel;
    private $cacheFile;
    private $cacheDuration = 900; //15min
    private $baseUrl = 'http://localhost/PoW-Project';

    public function __construct() {
        $this->rssModel = new RssModel();
        
        //realpath ul
        $publicDir = realpath(__DIR__ . '/../public');
        $rssDir = $publicDir . '/rss';
        
        if (!file_exists($rssDir)) {
            error_log("RSS Feed - Creating directory: " . $rssDir);
            mkdir($rssDir, 0755, true);
        }
        $this->cacheFile = $rssDir . '/feed.xml';
        error_log("RSS Feed - Cache file path: " . $this->cacheFile);
    }    public function test() {
        header('Content-Type: application/json');
        
        try {
            $dbInfo = $this->rssModel->getDatabaseInfo();
            $available = [];

            //iau detaliile la animalele disponibile
            if (isset($dbInfo['samples']) && !empty($dbInfo['samples'])) {
                foreach ($dbInfo['samples'] as $sample) {
                    $available[] = [
                        'id' => $sample['animal_id'],
                        'name' => $sample['name'],
                        'available' => $sample['available']
                    ];
                }
            }

            $response = [
                'status' => 'ok',
                'timestamp' => date('Y-m-d H:i:s'),
                'database_info' => [
                    'table_exists' => $dbInfo['table_exists'] ?? false,
                    'column_structure' => $dbInfo['columns'] ?? [],
                    'row_counts' => $dbInfo['counts'] ?? [],
                    'available_samples' => $available
                ],
                'cache_file' => [
                    'path' => $this->cacheFile,
                    'exists' => file_exists($this->cacheFile),
                    'size' => file_exists($this->cacheFile) ? filesize($this->cacheFile) : 0
                ]
            ];
            
            echo json_encode($response, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
        exit;
    }

    public function generateFeed() {
        try {
            //data pt feed
            $animals = $this->rssModel->getAvailableAnimals();
            error_log("RSS Feed - Retrieved animals count: " . count($animals));

            $news = $this->rssModel->getLatestNews();
            error_log("RSS Feed - Retrieved news count: " . count($news));      
            $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"></rss>');
            $channel = $xml->addChild('channel');
            $channel->addChild('title', htmlspecialchars('PoW Project - Pet Adoption and News'));
            $channel->addChild('link', htmlspecialchars($this->baseUrl));
            $channel->addChild('description', htmlspecialchars('Latest available pets and news from PoW Project'));
            $channel->addChild('language', 'en-US');
            $channel->addChild('lastBuildDate', date(DATE_RSS));
            $channel->addChild('ttl', '60');

            //adaug news items
            foreach ($news as $item) {
                error_log("RSS Feed - Adding news item: " . $item['title']);
                $entry = $channel->addChild('item');
                $entry->addChild('title', htmlspecialchars($item['title']));
                $entry->addChild('description', htmlspecialchars($item['content']));
                $entry->addChild('pubDate', date(DATE_RSS, strtotime($item['created_at'])));
                $entry->addChild('link', $this->baseUrl . '/dashboard.html#news-' . $item['news_id']);
                $entry->addChild('guid', $this->baseUrl . '/news/' . $item['news_id']);
                if (isset($item['author_name'])) {
                    $entry->addChild('author', htmlspecialchars($item['author_name']));
                }
            }

            //adaug animal items
            foreach ($animals as $animal) {
                error_log("RSS Feed - Adding animal: " . $animal['name']);
                $entry = $channel->addChild('item');
                $title = $animal['name'] . ' - ' . $animal['species'] . ' for Adoption';
                $entry->addChild('title', htmlspecialchars($title));
                  //descriere bine formatata
                $description = "<p><strong>About " . htmlspecialchars($animal['name']) . ":</strong></p>\n";
                $description .= "<ul>\n";
                $description .= "<li><strong>Species:</strong> " . htmlspecialchars($animal['species']) . "</li>\n";
                $description .= "<li><strong>Breed:</strong> " . htmlspecialchars($animal['breed']) . "</li>\n";
                $description .= "<li><strong>Age:</strong> " . htmlspecialchars($animal['age']) . "</li>\n";
                $description .= "<li><strong>Sex:</strong> " . htmlspecialchars($animal['sex']) . "</li>\n";
                $description .= "<li><strong>Health Status:</strong> " . htmlspecialchars($animal['health_status']) . "</li>\n";
                $description .= "<li><strong>Location:</strong> " . htmlspecialchars($animal['pickup_address']) . "</li>\n";
                $description .= "</ul>\n";
                
                if (!empty($animal['description'])) {
                    $description .= "<p><strong>Details:</strong></p>\n";
                    $description .= "<p>" . nl2br(htmlspecialchars($animal['description'])) . "</p>\n";
                }
                
                if (!empty($animal['owner_name']) && $animal['owner_name'] !== 'Anonymous') {
                    $description .= "<p><em>Listed by: " . htmlspecialchars($animal['owner_name']) . "</em></p>\n";
                }
                
                $entry->addChild('description', htmlspecialchars($description));
                $entry->addChild('pubDate', date(DATE_RSS, strtotime($animal['created_at'])));
                $entry->addChild('link', $this->baseUrl . '/animal.php?id=' . $animal['animal_id']);
                $entry->addChild('guid', $this->baseUrl . '/animal/' . $animal['animal_id']);
                
                if (!empty($animal['media_url'])) {
                    $enclosure = $entry->addChild('enclosure');
                    $enclosure->addAttribute('url', $this->baseUrl . '/' . ltrim($animal['media_url'], '/'));
                    $enclosure->addAttribute('type', 'image/jpeg');
                }
            }

            //cache-uiesc feed-ul
            if (file_put_contents($this->cacheFile, $xml->asXML())) {
                error_log("RSS Feed - Successfully cached feed");
            } else {
                error_log("RSS Feed - Failed to cache feed");
            }            //output
            header('Content-Type: application/xml; charset=utf-8');
            header('Access-Control-Allow-Origin: *');
            header('X-Content-Type-Options: nosniff');
            echo $xml->asXML();
            
        } catch (Exception $e) {
            error_log("RSS Feed - Error generating feed: " . $e->getMessage());
            header('HTTP/1.1 500 Internal Server Error');
            echo "Error generating RSS feed";
        }
    }

    private function isCacheValid() {
        if (!file_exists($this->cacheFile)) {
            error_log("RSS Feed - Cache file does not exist");
            return false;
        }

        $cacheAge = time() - filemtime($this->cacheFile);
        $isValid = $cacheAge < $this->cacheDuration;
        error_log("RSS Feed - Cache age: " . $cacheAge . "s, Valid: " . ($isValid ? "yes" : "no"));
        return $isValid;
    }
}
