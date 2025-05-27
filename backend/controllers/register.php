<?php
require_once '../config/db.php';
require_once '../models/UserModel.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nume = trim($_POST['nume']);
    $email = trim($_POST['email']);
    $telefon = trim($_POST['telefon']);
    $parola = $_POST['parola'];

    if (!$nume || !$email || !$telefon || !$parola) {
        echo "Complete all fields!";
        exit;
    }

    $user = findUserByEmail($conn, $email);
    if ($user) {
        echo "Email already exists!";
        exit;
    }

    $parolaHash = password_hash($parola, PASSWORD_DEFAULT);
    if (createUser($conn, $nume, $email, $telefon, $parolaHash)) {
        echo "Succesful autentification!";
    } else {
        echo "Registration error.";
    }
}
?>
