<?php
session_start();
require_once '../config/db.php';
require_once '../models/UserModel.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $parola = $_POST['parola'];

    $user = findUserByEmail($conn, $email);

    if (!$user || !password_verify($parola, $user['parola'])) {
        echo "Incorect email or password!";
        exit;
    }

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_nume'] = $user['nume'];
    echo "Succesful autentification!";
}
?>
