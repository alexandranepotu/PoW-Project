<?php include 'db.php'; ?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <title>Animale disponibile pentru adopție</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Animale disponibile pentru adopție</h1>
    <div class="lista-animale">
        <?php
        $sql = "SELECT * FROM animale";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            while($animal = $result->fetch_assoc()) {
                echo "<div class='card'>
                        <img src='uploads/{$animal['poza']}' alt='{$animal['nume']}'>
                        <h2>{$animal['nume']}</h2>
                        <p>Vârsta: {$animal['varsta']} ani</p>
                        <p>Rasă: {$animal['rasa']}</p>
                        <a href='animal.php?id={$animal['id']}'>Vezi detalii</a>
                      </div>";
            }
        } else {
            echo "<p>Momentan nu există animale disponibile.</p>";
        }

        $conn->close();
        ?>
    </div>
</body>
</html>
