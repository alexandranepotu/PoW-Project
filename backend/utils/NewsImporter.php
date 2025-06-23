<?php
require_once __DIR__ . '/../config/db.php';

class NewsImporter {
    private $pdo;
    
    public function __construct() {
        $this->pdo = getDbConnection();
    }

    public function importFromCSV($filePath) {
        if (!file_exists($filePath)) {
            throw new Exception("CSV file not found: " . $filePath);
        }
        
        $imported = 0;
        $errors = [];
        
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            // Skip header 
            $header = fgetcsv($handle, 1000, ",");
            
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                try {
                    if (count($data) >= 2) {
                        $title = trim($data[0]);
                        $content = trim($data[1]);
                        $date = isset($data[2]) ? trim($data[2]) : null;
                        
                        if (!empty($title) && !empty($content)) {
                            $this->insertNews($title, $content, $date);
                            $imported++;
                        }
                    }
                } catch (Exception $e) {
                    $errors[] = "Row error: " . $e->getMessage();
                }
            }
            fclose($handle);
        }
        
        return [
            'imported' => $imported,
            'errors' => $errors
        ];
    }
 
    public function importFromJSON($filePath) {
        if (!file_exists($filePath)) {
            throw new Exception("JSON file not found: " . $filePath);
        }
        
        $jsonData = file_get_contents($filePath);
        $newsItems = json_decode($jsonData, true);
        
        if (!$newsItems) {
            throw new Exception("Invalid JSON format");
        }
        
        $imported = 0;
        $errors = [];
        
        foreach ($newsItems as $item) {
            try {
                if (isset($item['title']) && isset($item['content'])) {
                    $title = trim($item['title']);
                    $content = trim($item['content']);
                    $date = isset($item['date']) ? trim($item['date']) : null;
                    
                    $this->insertNews($title, $content, $date);
                    $imported++;
                }
            } catch (Exception $e) {
                $errors[] = "Item error: " . $e->getMessage();
            }
        }
        
        return [
            'imported' => $imported,
            'errors' => $errors
        ];
    }

    public function exportToCSV($filePath) {
        $stmt = $this->pdo->query("SELECT * FROM news ORDER BY created_at DESC");
        $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $fp = fopen($filePath, 'w');
        
        // Header
        fputcsv($fp, ['Title', 'Content', 'Created At', 'ID']);
        
        // Data
        foreach ($news as $item) {
            fputcsv($fp, [
                $item['title'],
                $item['content'],
                $item['created_at'],
                $item['id']
            ]);
        }
        
        fclose($fp);
        return count($news);
    }
    
    private function insertNews($title, $content, $date = null) {
        $checkStmt = $this->pdo->prepare("SELECT id FROM news WHERE title = ?");
        $checkStmt->execute([$title]);
        
        if ($checkStmt->fetch()) {
            throw new Exception("News with title already exists: " . $title);
        }
          $sql = "INSERT INTO news (title, content, created_at) VALUES (?, ?, ?)";
        $createdAt = $date ? $date : date('Y-m-d H:i:s');
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$title, $content, $createdAt]);
    }
   
    public function importFromXML($filePath) {
        if (!file_exists($filePath)) {
            throw new Exception("XML file not found: " . $filePath);
        }
        
        $imported = 0;
        $errors = [];
        
        try {
            libxml_use_internal_errors(true);
            $xml = simplexml_load_file($filePath);
            
            if ($xml === false) {
                $xmlErrors = libxml_get_errors();
                $errorMessages = [];
                foreach ($xmlErrors as $error) {
                    $errorMessages[] = trim($error->message);
                }
                throw new Exception("Invalid XML file: " . implode(", ", $errorMessages));
            }
            
            foreach ($xml->news as $newsItem) {
                try {
                    $title = trim((string)$newsItem->title);
                    $content = trim((string)$newsItem->content);
                    $date = isset($newsItem->created_at) ? trim((string)$newsItem->created_at) : null;
                    
                    if (!empty($title) && !empty($content)) {
                        $this->insertNews($title, $content, $date);
                        $imported++;
                    } else {
                        $errors[] = "Missing title or content in XML item";
                    }
                } catch (Exception $e) {
                    $errors[] = "XML item error: " . $e->getMessage();
                }
            }
            
        } catch (Exception $e) {
            throw new Exception("XML processing error: " . $e->getMessage());
        }
        
        return [
            'imported' => $imported,
            'errors' => $errors
        ];
    }
    public function exportToXML($filePath) {
        $stmt = $this->pdo->prepare("SELECT id, title, content, created_at FROM news ORDER BY created_at DESC");
        $stmt->execute();
        $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/PoW-Project/backend/public/exports/news-export.xsl"?>
<news_export></news_export>');
        $xml->addChild('export_date', date('Y-m-d H:i:s'));
        $xml->addChild('total_items', count($news));
        
        foreach ($news as $item) {
            $newsNode = $xml->addChild('news');
            $newsNode->addChild('id', htmlspecialchars($item['id']));
            $newsNode->addChild('title', htmlspecialchars($item['title']));
            
            $contentNode = $newsNode->addChild('content');
            $contentNode[0] = null; // Clear node
            $dom = dom_import_simplexml($contentNode);
            $cdata = $dom->ownerDocument->createCDATASection($item['content']);
            $dom->appendChild($cdata);
            
            $newsNode->addChild('created_at', $item['created_at']);
        }
        
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;
        $dom->loadXML($xml->asXML());
        
        if ($dom->save($filePath)) {
            return count($news);
        } else {
            throw new Exception("Failed to save XML file");
        }
    }
}

if (isset($_GET['action'])) {
    $importer = new NewsImporter();
    
    try {
        switch ($_GET['action']) {
            case 'import-csv':
                if (isset($_FILES['csvFile']) && $_FILES['csvFile']['error'] === UPLOAD_ERR_OK) {
                    $result = $importer->importFromCSV($_FILES['csvFile']['tmp_name']);
                    echo json_encode(['success' => true, 'imported' => $result['imported'], 'errors' => $result['errors']]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'No CSV file uploaded or upload error']);
                }
                break;
                
            case 'export-csv':
                $filePath = __DIR__ . '/../../exports/news_export_' . date('Y-m-d_H-i-s') . '.csv';
                if (!file_exists(dirname($filePath))) {
                    mkdir(dirname($filePath), 0755, true);
                }
                $count = $importer->exportToCSV($filePath);
                echo json_encode([
                    'success' => true, 
                    'file' => basename($filePath), 
                    'count' => $count,
                    'download_url' => '/PoW-Project/exports/' . basename($filePath)
                ]);
                break;
                
            case 'import-xml':
                if (isset($_FILES['xmlFile']) && $_FILES['xmlFile']['error'] === UPLOAD_ERR_OK) {
                    $result = $importer->importFromXML($_FILES['xmlFile']['tmp_name']);
                    echo json_encode(['success' => true, 'imported' => $result['imported'], 'errors' => $result['errors']]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'No XML file uploaded or upload error']);
                }
                break;
                
            case 'export-xml':
                $filePath = __DIR__ . '/../../exports/news_export_' . date('Y-m-d_H-i-s') . '.xml';
                if (!file_exists(dirname($filePath))) {
                    mkdir(dirname($filePath), 0755, true);
                }
                $count = $importer->exportToXML($filePath);
                echo json_encode([
                    'success' => true, 
                    'file' => basename($filePath), 
                    'count' => $count,
                    'download_url' => '/PoW-Project/exports/' . basename($filePath)
                ]);
                break;
                
            default:
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
