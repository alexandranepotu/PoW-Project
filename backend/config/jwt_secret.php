<?php

// Use environment variable or fallback to default 
define('JWT_SECRET_KEY', $_ENV['JWT_SECRET_KEY'] ?? '<-Fd$|UfvKGraf%Cd+6x|\'*QG02m9V');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION_SECONDS', 3600 * 24); // 24 hours

?>