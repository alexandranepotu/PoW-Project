﻿# PoW - Pet Adoption on Web
Platformă web avansată pentru gestionarea adopțiilor de animale de companie, cu funcționalități moderne de management, comunicare și administrare.

![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat&logo=php&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=json-web-tokens&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-blue)

## Abstract
PoW (Pet World Management) este o aplicație web dezvoltată pentru a facilita adopția, gestionarea și urmărirea animalelor de companie. Platforma integrează funcționalități de management complet al animalelor, sistem de aplicații pentru adopție, comunicare între utilizatori și administrare avansată, adresând atât nevoile proprietarilor de animale, cât și ale potențialilor adoptatori.

## Table of Contents
- [Descriere generală](#descriere-generală)
- [Funcționalități principale](#funcționalități-principale)
- [Arhitectură și tehnologii](#arhitectură-și-tehnologii)
- [Paleta de Culori](#paleta-de-culori)
- [Structura proiectului](#structura-proiectului)
- [Instrucțiuni de instalare](#instrucțiuni-de-instalare)
- [Utilizare](#utilizare)
- [Testare și validare](#testare-și-validare)
- [Roadmap](#roadmap)
- [Contribuitori](#contribuitori)
- [Licență](#licență)
- [Contact](#contact)
- [Referințe](#referințe)

## Descriere generală
PoW oferă un cadru complet pentru gestionarea animalelor de companie, facilitând procesul de adopție și oferind instrumente avansate de urmărire a sănătății și îngrijirii animalelor. Platforma este destinată atât proprietarilor individuali, cât și organizațiilor de protecție a animalelor, oferind suport pentru operațiuni CRUD, filtrare avansată, sistem de mesagerie și analiză administrativă.

## Funcționalități principale
- **Gestionare animale**: Adăugare, editare, ștergere și vizualizare profile animale cu detalii extinse și istoric medical.
- **Sistem de adopție**: Aplicații pentru adopție cu workflow complet de aprobare/respingere.
- **Urmărire îngrijire**: Evidența hranei, vizitelor medicale și statusului de sănătate.
- **Mesagerie internă**: Sistem de comunicare între utilizatori pentru întrebări și coordonare adopții.
- **Filtrare și căutare avansată**: După specie, rasă, vârstă, status sănătate și alți parametri.
- **Administrare**: Panou dedicat pentru administratori (gestionare utilizatori, animale, moderare).
- **Securitate**: Autentificare JWT, înregistrare, validare, sesiuni securizate.
- **Export/Import date**: Sistem de export/import pentru știri și date administrative.
- **RSS Feed**: Generare automată de feed-uri RSS pentru știri.

## Arhitectură și tehnologii
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Fetch API, DOM Manipulation
- **Backend**: PHP 8+, PDO, JWT Authentication, RESTful API
- **Bază de date**: PostgreSQL 14+ cu suport pentru date complexe
- **Securitate**: Protecție XSS, prevenire SQL Injection, HttpOnly cookies
- **Structură modulară**: Separare clară între controllere, modele și view-uri pentru mentenanță și scalabilitate.

## Paleta de Culori

### Light Mode
| Element | Culoare | Hex | Utilizare |
|---------|---------|-----|-----------|
| Background Principal | ![#F9F5F9](https://via.placeholder.com/15/F9F5F9/000000?text=+) | `#F9F5F9` | Fundal principal, text secundar în dark mode |
| Background Secundar | ![#D4D7CF](https://via.placeholder.com/15/D4D7CF/000000?text=+) | `#D4D7CF` | Fundal secundar, culoare neutră |
| Text Principal | ![#121212](https://via.placeholder.com/15/121212/000000?text=+) | `#121212` | Text principal, fundal în dark mode |
| Culoare Brand | ![#5E2E65](https://via.placeholder.com/15/5E2E65/000000?text=+) | `#5E2E65` | Butoane principale, elemente brand |
| Accent Teal | ![#5C9E9A](https://via.placeholder.com/15/5C9E9A/000000?text=+) | `#5C9E9A` | Hover effects, accent secundar |
| Accent Orange | ![#EEA525](https://via.placeholder.com/15/EEA525/000000?text=+) | `#EEA525` | Accent principal, warning colors |

### Dark Mode
| Element | Culoare | Hex | Utilizare |
|---------|---------|-----|-----------|
| Background Principal | ![#121212](https://via.placeholder.com/15/121212/000000?text=+) | `#121212` | Fundal principal în dark mode |
| Background Secundar | ![#2C2F2B](https://via.placeholder.com/15/2C2F2B/000000?text=+) | `#2C2F2B` | Fundal secundar în dark mode |
| Text Principal | ![#F9F5F9](https://via.placeholder.com/15/F9F5F9/000000?text=+) | `#F9F5F9` | Text principal în dark mode |
| Text Secundar | ![#aaaaaa](https://via.placeholder.com/15/aaaaaa/000000?text=+) | `#aaaaaa` | Text secundar în dark mode |
| Primary Button | ![#5C9E9A](https://via.placeholder.com/15/5C9E9A/000000?text=+) | `#5C9E9A` | Butoane principale în dark mode |
| Primary Hover | ![#EEA525](https://via.placeholder.com/15/EEA525/000000?text=+) | `#EEA525` | Hover effects în dark mode |

### Variabile CSS
```css
:root {
    /* Culori de bază */
    --c1: #F9F5F9;    /* Light background */
    --c2: #121212;    /* Dark text/background */
    --c3: #5C9E9A;    /* Teal accent */
    --c4: #EEA525;    /* Orange accent */
    --c5: #5E2E65;    /* Purple brand */
    --c6: #D4D7CF;    /* Sage neutral */
}

:root[data-theme="dark"] {
    --bg-primary: #121212;
    --bg-secondary: #2C2F2B;
    --text-primary: #F9F5F9;
    --primary-color: #5C9E9A;
    --primary-hover: #EEA525;
}
```

## Structura proiectului
```
PoW-Project/
├── index.php
├── composer.json
├── frontend/
│   ├── assets/         # CSS, imagini, stiluri
│   ├── js/             # JavaScript modules
│   ├── views/          # Pagini HTML
│   └── templates/      # Template-uri reutilizabile
├── backend/
│   ├── config/         # Configurări aplicație și DB
│   ├── controllers/    # Logica de business
│   ├── models/         # Modele pentru DB
│   ├── middleware/     # Middleware-uri (Auth, Admin)
│   ├── routes/         # Rutele API
│   ├── utils/          # Utilitare (NewsImporter)
│   └── public/         # Entry point API
├── uploads/            # Fișiere încărcate (imagini animale)
└── exports/            # Fișiere exportate
```

## Instrucțiuni de instalare

### Cerințe preliminare
- PHP 8.0+
- PostgreSQL 14+
- Composer
- Server web (Apache)

### Pași de instalare

1. **Clonează proiectul**
```bash
git clone https://github.com/username/PoW-Project.git
cd PoW-Project
```

2. **Instalează dependențele PHP**
```bash
composer install
```

3. **Creează baza de date**
```sql
createdb pow_bd
psql -d pow_bd -f backend/db/schema.sql
```

4. **Configurează conexiunea la baza de date**
```php
// backend/config/db.php
$host = 'localhost';
$dbname = 'pow_bd';
$username = 'postgres';
$password = 'your_password';
```

5. **Pornește serverul**
```bash
php -S localhost:8000
# sau folosește XAMPP și accesează http://localhost/PoW-Project/
```

## Utilizare
1. **Înregistrează-te** sau **autentifică-te** în sistem
2. **Adaugă și gestionează** animalele tale de companie
3. **Completează evidențele** de hrană și vizite medicale
4. **Caută și aplică** pentru adopția animalelor disponibile
5. **Comunică** cu proprietarii prin sistemul de mesagerie
6. **Accesează panoul de administrare** pentru management avansat (doar admini)

## Testare și validare
Pentru testarea funcționalităților:
- **Testare manuală** prin interfața web cu utilizatori de test
- **Validare securitate** prin încercarea de injecție SQL și XSS
- **Testare API** prin tools precum Postman sau cURL
- **Verificare autentificare** și autorizare pe diferite endpoint-uri

## Roadmap
- [x] Sistem de autentificare și autorizare
- [x] Management complet animale (CRUD)
- [x] Aplicații pentru adopție cu workflow
- [x] Mesagerie și comunicare
- [x] Panou administrativ
- [x] Securitate avansată (XSS, SQL Injection)
- [x] Export/Import date și RSS
- [ ] Notificări pe email
- [ ] Sistem de rating și review-uri
- [ ] Integrare calendar pentru programări
- [ ] Aplicație mobilă

## Contribuitori
- **Nepotu Alexandra-Maria** - Dezvoltare și implementare
- **Plamada Bianca-Elena** - Dezvoltare și testare
- **Contributor Principal** - Arhitectură și coordonare

## Licență
Acest proiect este open-source sub licența MIT.

```
MIT License

```

## Contact
- **Email**: pow.contact@example.com
- **GitHub**: [PoW-Project](https://github.com/username/PoW-Project)

## Referințe
- [PHP Documentation](https://www.php.net/docs.php)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Documentation](https://jwt.io/)
- [Leaflet.js Documentation](https://leafletjs.com/reference.html)

---
*Proiect academic dezvoltat pentru managementul modern al adopțiilor de animale de companie*

