<?php include 'navbar.php'; ?>
<?php
header('Content-Type: application/json');

$conn_string = "host=localhost dbname=adoptii user=postgres password=password";
$conn = pg_connect($conn_string);

if (!$conn) {
    echo json_encode(['error' => 'Failed to connect']);
    exit;
}

$query = "SELECT * FROM animale WHERE 1=1";

if (!empty($_GET['species'])) {
    $species = pg_escape_string($conn, $_GET['species']);
    $query .= " AND species ILIKE '%$species%'";
}

if (!empty($_GET['breed'])) {
    $breed = pg_escape_string($conn, $_GET['breed']);
    $query .= " AND breed ILIKE '%$breed%'";
}

if (!empty($_GET['age'])) {
    $age = intval($_GET['age']);
    $query .= " AND age = $age";
}

if (!empty($_GET['sex'])) {
    $sex = pg_escape_string($conn, $_GET['sex']);
    $query .= " AND sex = '$sex'";
}

if (!empty($_GET['health_status'])) {
    $health_status = pg_escape_string($conn, $_GET['health_status']);
    $query .= " AND health_status ILIKE '%$health_status%'";
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
