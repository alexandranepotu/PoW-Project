<?php
$host = 'localhost';
$port = '5432';
$dbname = 'pet_adoption';
$user = 'postgres';
$password = 'password';

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    die("Eroare la conectarea la PostgreSQL: " . pg_last_error());
}
?>
//require_once 'db.php';->restul fisierelor

