<?php include 'navbar.php'; ?>
<?php
header('Content-Type: application/json');

$conn_string = "host=localhost dbname=pet_adoption user=postgres password=password";
$conn = pg_connect($conn_string);

if (!$conn) {
    echo json_encode(['error' => 'Failed to connect']);
    exit;
}

$query = "SELECT a.*, (
    SELECT m.file_path FROM media_resources m WHERE m.animal_id = a.animal_id LIMIT 1
) AS media_url FROM animale a WHERE 1=1";

if (!empty($_GET['species'])) {
    $species = pg_escape_string($conn, $_GET['species']);
    $query .= " AND a.species ILIKE '%$species%'";
}

if (!empty($_GET['breed'])) {
    $breed = pg_escape_string($conn, $_GET['breed']);
    $query .= " AND a.breed ILIKE '%$breed%'";
}

if (!empty($_GET['age'])) {
    $age = intval($_GET['age']);
    $query .= " AND a.age = $age";
}

if (!empty($_GET['sex'])) {
    $sex = pg_escape_string($conn, $_GET['sex']);
    $query .= " AND a.sex = '$sex'";
}

if (!empty($_GET['health_status'])) {
    $health_status = pg_escape_string($conn, $_GET['health_status']);
    $query .= " AND a.health_status ILIKE '%$health_status%'";
}

$result = pg_query($conn, $query);
$animals = [];

if ($result) {
    while ($row = pg_fetch_assoc($result)) {
        $animals[] = $row;
    }
}

echo json_encode($animals);
pg_close($conn);
