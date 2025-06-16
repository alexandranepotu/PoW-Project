<?php
$host = 'localhost';
$port = '5432';
$dbname = 'pet_adoption';
$user = 'postgres';
$password = 'password';

function getDbConnection() {
    global $host, $port, $dbname, $user, $password;
    
    try {
        $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

//pt UserAddressModel->simplifica crearea conexiunii la bd
    try {
        $pdo = getDbConnection();
    } catch (Exception $e) {
        error_log("Database connection failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }

