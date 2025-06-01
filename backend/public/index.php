<?php
//pornim sesiunea->login
session_start();

ini_set('display_errors', 1);
error_reporting(E_ALL);

//headere pentru CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

//daca este o cerere OPTIONS, raspundem imediat
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

//raspunsurile vor fi in format json
header('Content-Type: application/json');

//conexiunea la bd
require_once __DIR__ . '/../config/db.php';
//includem routerul care trateaza rutele de tip api
require_once __DIR__ . '/../routes/api.php';