<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

//headere pentru CORS și JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

//daca este o cerere OPTIONS, raspundem imediat
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

//conexiunea la bd
require_once __DIR__ . '/../config/db.php';
//includem routerul care trateaza rutele de tip api
require_once __DIR__ . '/../routes/api.php';