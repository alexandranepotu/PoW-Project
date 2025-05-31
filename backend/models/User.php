<?php
//face interactiunea cu tabela users
class User {
    private $pdo; //conexiune bd

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    //creaza utilizatorul
 public function create($fullName, $username, $email, $phone, $password) {
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, email, password_hash, full_name, phone) 
            VALUES (:username, :email, :password_hash, :full_name, :phone)";

    try {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':username' => $username,
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':full_name' => $fullName,
            ':phone' => $phone
        ]);
    } catch (PDOException $e) {
        // Afișează eroarea SQL
        error_log('DB Error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        return false;
    }
}



    //cauta userul dupa nume
    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = :username LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    //cauta userul dupa email
    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
