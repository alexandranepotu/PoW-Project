<?php
include 'db.php';

$id = $_GET['id'];
$sql = "SELECT * FROM animale WHERE id=$id";
$result = $conn->query($sql);
$animal = $result->fetch_assoc();
$conn->close();
?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <title><?php echo $animal['nume']; ?> - Detalii</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <a href="index.php">← Înapoi la listă</a>
    <div class="card">
        <img src="uploads/<?php echo $animal['poza']; ?>" alt="<?php echo $animal['nume']; ?>">
        <h2><?php echo $animal['nume']; ?></h2>
        <p>Vârsta: <?php echo $animal['varsta']; ?> ani</p>
        <p>Rasă: <?php echo $animal['rasa']; ?></p>
        <p><?php echo nl2br($animal['descriere']); ?></p>
    </div>
</body>
</html>
