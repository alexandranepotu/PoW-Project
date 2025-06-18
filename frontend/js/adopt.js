//iau din bd detaliile despre animalsi fac formul de adoptie
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const animalId = params.get('id');
    const detailsDiv = document.getElementById('animal-details');

    if (animalId) {
        fetch(`../../backend/controllers/PetPageController.php?action=getAnimalById&id=${animalId}`)
            .then(res => res.json())
            .then(animal => {
                if (animal && animal.id) {
                    let feedingHtml = '';
                    if (animal.feeding_journal && animal.feeding_journal.length > 0) {
                        feedingHtml = '<h2>Feeding Journal</h2><ul>' +
                            animal.feeding_journal.map(f => `<li>${f.feed_time}: ${f.food_type} (${f.notes || ''})</li>`).join('') + '</ul>';
                    } else {
                        feedingHtml = '<h2>Feeding Journal</h2><p>No feeding records found.</p>';
                    }

                    let medicalHtml = '';
                    if (animal.medical_visits && animal.medical_visits.length > 0) {
                        medicalHtml = '<h2>Medical Visits</h2><ul>' +
                            animal.medical_visits.map(m => `<li>${m.date_of_event}: ${m.description} (${m.treatment || ''})</li>`).join('') + '</ul>';
                    } else {
                        medicalHtml = '<h2>Medical Visits</h2><p>No medical records found.</p>';
                    }

                    //face path pt imagine
                    let imgPath = '';
                    if (animal.media_url) {
                        if (animal.media_url.startsWith('/') || animal.media_url.startsWith('http')) {
                            imgPath = animal.media_url;
                        } else {
                            imgPath = `../uploads/pets/${animal.id}/${animal.media_url}`;
                        }
                    } else {
                        imgPath = '../assets/images/default.jpg';
                    }
                    let imgHtml = `<img id="animal-img" src="${imgPath}" alt="${animal.name}">`;

                    detailsDiv.innerHTML = `
                        ${imgHtml}
                        <h1>${animal.name}</h1>
                        <p><strong>Species:</strong> ${animal.species}</p>
                        <p><strong>Breed:</strong> ${animal.breed}</p>
                        <p><strong>Age:</strong> ${animal.age}</p>
                        <p><strong>Description:</strong> ${animal.description}</p>
                        ${feedingHtml}
                        ${medicalHtml}
                    `;

                    //daca nu exista imagine se pune default
                    const img = document.getElementById('animal-img');
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = '../assets/images/default.jpg';
                    };
                } else {
                    detailsDiv.innerHTML = '<p>Animal not found.</p>';
                }
            })
            .catch(() => {
                detailsDiv.innerHTML = '<p>Error loading animal details.</p>';
            });
    } else {
        detailsDiv.innerHTML = '<p>No animal selected.</p>';
    }

    document.getElementById('adoption-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Your application has been submitted! (Form handling to be implemented)');
        window.location.href = 'animale.html';
        //a mai ramas de trimis datele din formular catre backend
    });
});
