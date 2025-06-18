<?php
class PetPageModel {
    private $conn;

    public function __construct() {
        $this->conn = pg_connect("host=localhost dbname=pet_adoption user=postgres password=Teiubesc78978*");
        if (!$this->conn) {
            die("Connection failed");
        }
    }

    public function getAnimals($filters) {
        //verific daca animalul e disponibil
        $query = "SELECT a.*, m.file_path AS media_url
                  FROM animals a 
                  LEFT JOIN media_resources m ON a.animal_id = m.animal_id 
                  WHERE a.available = TRUE";

        if (!empty($filters['species'])) {
            $query .= " AND a.species ILIKE '%" . pg_escape_string($this->conn, $filters['species']) . "%'";
        }
        if (!empty($filters['breed'])) {
            $query .= " AND a.breed ILIKE '%" . pg_escape_string($this->conn, $filters['breed']) . "%'";
        }
        if (!empty($filters['age'])) {
            $query .= " AND a.age = " . intval($filters['age']);
        }
        if (!empty($filters['sex'])) {
            $query .= " AND a.sex = '" . pg_escape_string($this->conn, $filters['sex']) . "'";
        }
        if (!empty($filters['health_status'])) {
            $query .= " AND a.health_status ILIKE '%" . pg_escape_string($this->conn, $filters['health_status']) . "%'";
        }

        $result = pg_query($this->conn, $query);
        $animals = [];
        while ($row = pg_fetch_assoc($result)) {
            $animals[] = $row;
        }

        return $animals;
    }

    public function getAvailableAnimals() {
        $query = "SELECT a.*, m.file_path AS media_url
                  FROM animals a 
                  LEFT JOIN media_resources m ON a.animal_id = m.animal_id 
                  WHERE a.available = TRUE";
        $result = pg_query($this->conn, $query);
        $animals = [];
        while ($row = pg_fetch_assoc($result)) {
            $animals[] = $row;
        }
        return $animals;
    }

    public function __destruct() {
        pg_close($this->conn);
    }
}
?>
