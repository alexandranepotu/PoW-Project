<?php
$host = 'localhost';
$port = '5432';
$dbname = 'pet_adoption';
$user = 'postgres';
$password = 'password';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
//require_once 'db.php';->restul fisierelor

