<?php
class Animal {
    private $conn;

    public function __construct() {
        $this->conn = pg_connect("host=localhost dbname=animals user=postgres password=password*");
        if (!$this->conn) {
            die("Connection failed");
        }
    }

    public function getAnimals($filters) {
        $query = "SELECT * FROM animals WHERE 1=1";

        if (!empty($filters['species'])) {
            $query .= " AND species ILIKE '%" . pg_escape_string($this->conn, $filters['species']) . "%'";
        }
        if (!empty($filters['breed'])) {
            $query .= " AND breed ILIKE '%" . pg_escape_string($this->conn, $filters['breed']) . "%'";
        }
        if (!empty($filters['age'])) {
            $query .= " AND age = " . intval($filters['age']);
        }
        if (!empty($filters['sex'])) {
            $query .= " AND sex = '" . pg_escape_string($this->conn, $filters['sex']) . "'";
        }
        if (!empty($filters['health_status'])) {
            $query .= " AND health_status ILIKE '%" . pg_escape_string($this->conn, $filters['health_status']) . "%'";
        }

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
