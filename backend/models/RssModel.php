<?php
require_once __DIR__ . '/../config/db.php';

class RssModel {
    private $pdo;
    private $itemLimit = 50; //limitare nr articole->50
    private $dbName = 'pet_adoption';

    public function __construct() {
        try {
            $this->pdo = getDbConnection();
            
            //testez conex si obtin info despre bd
            $dbInfo = $this->pdo->query("SELECT current_database(), current_user, version()");
            $info = $dbInfo->fetch(PDO::FETCH_ASSOC);
            error_log("RSS Feed - Database info: " . print_r($info, true));
            
            //verif ca conexiunea este la baza de date corecta
            if ($info['current_database'] !== $this->dbName) {
                error_log("RSS Feed - WARNING: Connected to {$info['current_database']}, expected {$this->dbName}");
            }
            
            //tabele disponibile in schema public
            $tables = $this->pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            $tableList = $tables->fetchAll(PDO::FETCH_COLUMN);
            error_log("RSS Feed - Available tables: " . implode(', ', $tableList));
            
            //verif structura tabelului animals
            $animalCols = $this->pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'animals'");
            $columns = $animalCols->fetchAll(PDO::FETCH_ASSOC);
            error_log("RSS Feed - Animals table structure: " . print_r($columns, true));
            
        } catch (PDOException $e) {
            error_log("RSS Feed - Database connection failed: " . $e->getMessage());
            throw $e;
        }
    }    public function getAvailableAnimals() {
        try {
            //verif existenta
            $tableExists = $this->pdo->query("SELECT to_regclass('public.animals')");
            $exists = $tableExists->fetch(PDO::FETCH_COLUMN);
            error_log("RSS Feed - Animals table exists check: " . ($exists ? "Yes" : "No"));

            //iau total count si statusurile disponibile
            $debugQuery = "SELECT count(*) as total, 
                                 count(*) FILTER (WHERE available IS TRUE) as available_true,
                                 count(*) FILTER (WHERE available IS FALSE) as available_false,
                                 count(*) FILTER (WHERE available IS NULL) as available_null
                          FROM animals";
            $stmt = $this->pdo->query($debugQuery);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("RSS Feed - Animal counts: " . print_r($counts, true));

            //exemplu
            $sampleQuery = "SELECT * FROM animals LIMIT 1";
            $stmt = $this->pdo->query($sampleQuery);
            if ($sample = $stmt->fetch(PDO::FETCH_ASSOC)) {
                error_log("RSS Feed - Sample animal record: " . print_r($sample, true));
            }
        } catch (PDOException $e) {
            error_log("RSS Feed - Error checking animals table: " . $e->getMessage());
        } 
            $query = "
                WITH MediaImages AS (
                    SELECT DISTINCT ON (animal_id) 
                        animal_id, 
                        file_path,
                        created_at
                    FROM media_resources 
                    WHERE type = 'image' OR type IS NULL
                    ORDER BY animal_id, created_at DESC
                )
                SELECT 
                    a.animal_id,
                    COALESCE(a.name, 'Unnamed Pet') as name,
                    COALESCE(a.species, 'Unknown') as species,
                    COALESCE(a.breed, 'Mixed/Unknown') as breed,
                    COALESCE(a.age::text, 'Unknown') as age,
                    COALESCE(a.sex, 'Unknown') as sex,                    COALESCE(a.health_status, 'Not specified') as health_status,
                    COALESCE(a.description, 'No description available') as description,
                    COALESCE(a.pickup_address, 'Contact for location') as pickup_address,
                    COALESCE(u.username, 'Anonymous') as owner_name,
                    m.file_path as media_url
                FROM animals a
                LEFT JOIN users u ON a.added_by = u.user_id
                LEFT JOIN MediaImages m ON a.animal_id = m.animal_id
                WHERE a.available = true
                ORDER BY a.animal_id DESC
                LIMIT $1";
            
            //debugging
            error_log("RSS Feed - Executing query: " . str_replace(array("\n", "\r"), ' ', $query));        try {
            $stmt = $this->pdo->prepare($query);
            $success = $stmt->execute([$this->itemLimit]);
            
            error_log("RSS Feed - Query execution success: " . ($success ? "true" : "false"));
            if (!$success) {
                error_log("RSS Feed - Query error: " . print_r($stmt->errorInfo(), true));
            }
              //rezultate
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("RSS Feed - Retrieved " . count($results) . " animals");
            
            if (empty($results)) {
                error_log("RSS Feed - No animals returned, checking why...");
                
                //animale totale
                $totalQuery = "SELECT COUNT(*) as total FROM animals";
                $total = $this->pdo->query($totalQuery)->fetch(PDO::FETCH_ASSOC);
                error_log("RSS Feed - Total animals in database: " . $total['total']);
                
                //animale valabile
                $availableQuery = "SELECT COUNT(*) as count FROM animals WHERE available = true";
                $available = $this->pdo->query($availableQuery)->fetch(PDO::FETCH_ASSOC);
                error_log("RSS Feed - Available animals: " . $available['count']);
                
                //verif mediajoin
                $noMediaQuery = "SELECT COUNT(*) as count FROM animals a WHERE a.available = true";
                $noMedia = $this->pdo->query($noMediaQuery)->fetch(PDO::FETCH_ASSOC);
                error_log("RSS Feed - Available animals (without media join): " . $noMedia['count']);
                
                //ex animal
                $sampleQuery = "SELECT * FROM animals WHERE available = true LIMIT 1";
                $sample = $this->pdo->query($sampleQuery)->fetch(PDO::FETCH_ASSOC);
                if ($sample) {
                    error_log("RSS Feed - Sample available animal: " . print_r($sample, true));
                }
            } else {
                error_log("RSS Feed - Sample result: " . print_r($results[0], true));
                //debug pt toate animalele
                $animalIds = array_map(function($animal) {
                    return $animal['animal_id'];
                }, $results);
                error_log("RSS Feed - Retrieved animal IDs: " . implode(', ', $animalIds));
                //debug primul rez
                error_log("RSS Feed - Sample animal data: " . json_encode($results[0], JSON_PRETTY_PRINT));
            }
            
            return $results;
        } catch (PDOException $e) {
            error_log("RSS Feed - Error fetching animals: " . $e->getMessage());
            error_log("RSS Feed - SQL State: " . $e->errorInfo[0]);
            error_log("RSS Feed - Error Code: " . $e->errorInfo[1]);
            error_log("RSS Feed - Error Message: " . $e->errorInfo[2]);
            return [];
        }
    }

    public function getLatestNews() {
        try {
            $tableCheck = "SELECT to_regclass('public.news')";
            $stmt = $this->pdo->query($tableCheck);
            $exists = $stmt->fetch(PDO::FETCH_COLUMN);
            error_log("RSS Feed - News table exists check: " . ($exists ? "Yes" : "No"));
            
            //total news
            $countQuery = "SELECT count(*) FROM news";
            $stmt = $this->pdo->query($countQuery);
            $count = $stmt->fetch(PDO::FETCH_COLUMN);
            error_log("RSS Feed - Total news items in database: " . $count);
        } catch (PDOException $e) {
            error_log("RSS Feed - Error checking news table: " . $e->getMessage());
            return [];
        }        $query = "
            SELECT 
                n.id as news_id,
                n.title,
                n.content,
                n.created_at,
                'System' as author_name
            FROM news n
            ORDER BY n.created_at DESC
            LIMIT $1";

        try {
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$this->itemLimit]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($results)) {
                error_log("RSS Feed - No news items found in database");
            } else {
                error_log("RSS Feed - Retrieved " . count($results) . " news items");
                //debug
                error_log("RSS Feed - Sample news data: " . json_encode($results[0], JSON_PRETTY_PRINT));
            }
            
            return $results;
        } catch (PDOException $e) {
            error_log("RSS Feed - Error fetching news: " . $e->getMessage());
            error_log("RSS Feed - SQL State: " . $e->errorInfo[0]);
            error_log("RSS Feed - Error Code: " . $e->errorInfo[1]);
            error_log("RSS Feed - Error Message: " . $e->errorInfo[2]);
            return [];
        }
    }

    public function getDatabaseInfo() {
        $info = [];
        
        try {
            //verif
            $tableExists = $this->pdo->query("SELECT to_regclass('public.animals')");
            $info['table_exists'] = (bool)$tableExists->fetch(PDO::FETCH_COLUMN);

            if ($info['table_exists']) {
                //info la column
                $colQuery = "SELECT column_name, data_type, is_nullable 
                            FROM information_schema.columns 
                            WHERE table_name = 'animals'";
                $cols = $this->pdo->query($colQuery);
                $info['columns'] = $cols->fetchAll(PDO::FETCH_ASSOC);

                //row counts si valabilitate animale
                $countQuery = "SELECT 
                    count(*) as total,
                    count(*) FILTER (WHERE available = true) as available_true,
                    count(*) FILTER (WHERE available = false) as available_false,
                    count(*) FILTER (WHERE available IS NULL) as available_null
                FROM animals";
                $counts = $this->pdo->query($countQuery);
                $info['counts'] = $counts->fetch(PDO::FETCH_ASSOC);

                //ex animale disponibile
                $sampleQuery = "SELECT * FROM animals WHERE available = true LIMIT 3";
                $samples = $this->pdo->query($sampleQuery);
                $info['samples'] = $samples->fetchAll(PDO::FETCH_ASSOC);
            }

            return $info;
        } catch (PDOException $e) {
            error_log("RSS Feed - Error getting database info: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
    
    public function getFilteredAnimals($filters = []) {
        try {
            // verificari existenta pt tabele
            $tableExists = $this->pdo->query("SELECT to_regclass('public.animals')");
            $exists = $tableExists->fetch(PDO::FETCH_COLUMN);
            if (!$exists) {
                error_log("RSS Filtered Feed - Animals table does not exist");
                return [];
            }
            $query = "
                SELECT 
                    a.animal_id,
                    a.name,
                    a.species,
                    a.breed,
                    a.age,
                    a.sex,
                    a.health_status,
                    a.description,
                    a.pickup_address,
                    a.available,
                    u.username as owner_name,
                    CURRENT_TIMESTAMP as created_at                FROM animals a
                LEFT JOIN users u ON a.added_by = u.user_id";
              $params = [];
            
            // adaug conditia where doar daca avem filtre
            $whereConditions = [];
            
            //filtrari dinamice
            if (!empty($filters['sex'])) {
                $whereConditions[] = "LOWER(a.sex) = LOWER(?)";
                $params[] = $filters['sex'];
            }
            
            if (!empty($filters['location'])) {
                $whereConditions[] = "a.pickup_address ILIKE ?";
                $params[] = '%' . $filters['location'] . '%';
            }
            
            if (!empty($filters['species'])) {
                $whereConditions[] = "a.species ILIKE ?";
                $params[] = '%' . $filters['species'] . '%';
            }
            
            if (!empty($filters['breed'])) {
                $whereConditions[] = "a.breed ILIKE ?";
                $params[] = '%' . $filters['breed'] . '%';
            }
            
            if (isset($filters['age_min']) && is_numeric($filters['age_min'])) {
                $whereConditions[] = "a.age >= ?";
                $params[] = intval($filters['age_min']);
            }
            
            if (isset($filters['age_max']) && is_numeric($filters['age_max'])) {
                $whereConditions[] = "a.age <= ?";
                $params[] = intval($filters['age_max']);
            }
            
            // adaug where doar daca avem conditii
            if (!empty($whereConditions)) {
                $query .= " WHERE " . implode(" AND ", $whereConditions);
            }
            
            $query .= " ORDER BY a.animal_id DESC LIMIT ?";
            $params[] = $this->itemLimit;
            
            error_log("RSS Filtered Feed - Executing query with filters: " . json_encode($filters));
            error_log("RSS Filtered Feed - Query parameters: " . json_encode($params));
            error_log("RSS Filtered Feed - Final query: " . $query);
            
            $stmt = $this->pdo->prepare($query);
            $success = $stmt->execute($params);
            
            if (!$success) {
                error_log("RSS Filtered Feed - Query error: " . print_r($stmt->errorInfo(), true));
                return [];
            }
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("RSS Filtered Feed - Retrieved " . count($results) . " filtered animals");
            
            // afisez rezultatele
            if (!empty($results)) {
                error_log("RSS Filtered Feed - First result: " . json_encode($results[0], JSON_PRETTY_PRINT));
            }
            
            return $results;
            
        } catch (PDOException $e) {
            error_log("RSS Filtered Feed - Error fetching filtered animals: " . $e->getMessage());
            error_log("RSS Filtered Feed - SQL State: " . $e->errorInfo[0]);
            error_log("RSS Filtered Feed - Error Code: " . $e->errorInfo[1]);
            error_log("RSS Filtered Feed - Error Message: " . $e->errorInfo[2]);
            return [];
        }
    }
}
