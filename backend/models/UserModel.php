<?php
function findUserByEmail($conn, $email) {
    $query = "SELECT * FROM users WHERE email = $1";
    $result = pg_query_params($conn, $query, [$email]);
    return pg_fetch_assoc($result);
}

function createUser($conn, $nume, $email, $telefon, $parolaHash) {
    $query = "INSERT INTO users (nume, email, telefon, parola) VALUES ($1, $2, $3, $4)";
    return pg_query_params($conn, $query, [$nume, $email, $telefon, $parolaHash]);
}
