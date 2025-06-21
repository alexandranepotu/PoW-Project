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

        if ($this->findByUsername($username)) {
            return ['success' => false, 'message' => 'Username already exists.'];
        }

        if ($this->findByEmail($email)) {
            return ['success' => false, 'message' => 'Email already exists.'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email format.'];
        }

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
            //afiseaza eroarea SQL
            error_log('DB Error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }


    //cauta userul dupa nume
    public function findByUsername($username) {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    //cauta userul dupa email
    public function findByEmail($email) {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }    public function login($username, $password) {
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = ?');
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                error_log("User not found: " . $username);
                return ['success' => false, 'message' => 'Invalid username or password'];
            }

            if (!password_verify($password, $user['password_hash'])) {
                error_log("Invalid password for user: " . $username);
                return ['success' => false, 'message' => 'Invalid username or password'];
            }
            
            return ['success' => true, 'user' => [                'id' => $user['user_id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'is_admin' => $user['is_admin'] === 't' || $user['is_admin'] === true || $user['is_admin'] === '1' || $user['is_admin'] === 1
            ]];
        } catch (PDOException $e) {
            error_log('Database error during login: ' . $e->getMessage());
            throw new Exception('Database error occurred');
        }
    }    public function findById($id) {
    $stmt = $this->pdo->prepare("SELECT * FROM users WHERE user_id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
public function updateProfile($userId, $fullName, $username, $email, $phone) {
    try {
        $sql = "UPDATE users SET full_name = :full_name, username = :username, email = :email, phone = :phone WHERE user_id = :user_id";
        
        $stmt = $this->pdo->prepare($sql);
        
        $result = $stmt->execute([
            ':full_name' => $fullName,
            ':username' => $username,
            ':email' => $email,
            ':phone' => $phone,
            ':user_id' => $userId
        ]);
        
        return $result;
    } catch (PDOException $e) {
        error_log('Update profile error: ' . $e->getMessage());
        return false;
    }
}
}
?>
