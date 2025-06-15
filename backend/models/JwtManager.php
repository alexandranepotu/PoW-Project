<?php
//pentru generearea si validarea jwt-urilor
require_once __DIR__ . '/../config/jwt_secret.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtManager {
    
    //genereaza un jwt
    public static function generateToken(array $data): string {
        $issuedAt = time();
        $expirationTime = $issuedAt + JWT_EXPIRATION_SECONDS; //token valid pt timpul stabilit

        $payload = array(
            'iat' => $issuedAt, //timpul la care a fost emis token ul
            'exp' => $expirationTime, //timpul de expirare
            'data' => $data //datele specifice utilizatorului
        );

        //encode cu cheia secreta + alg hs256
        return JWT::encode($payload, JWT_SECRET_KEY, JWT_ALGORITHM);
    }

    //valideaza+decodeaza jwt
    public static function validateToken(string $token) {
        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET_KEY, JWT_ALGORITHM));
            return $decoded->data; //returneaza doar datele specifice utilizatorului
        } catch (Exception $e) {
            error_log("JWT Validation Error: " . $e->getMessage());
            return null;
        }
    }
}
?>