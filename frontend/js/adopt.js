//iau din bd detaliile despre animalsi fac formul de adoptie
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const animalId = params.get('id');
    const detailsDiv = document.getElementById('animal-details');

    async function fetchAnimalDetails(animalId) {
        //mereu fol endpoint ul REST API
        const res = await fetch(`http://localhost/PoW-Project/backend/public/api/animals?id=${animalId}`);
        const animals = await res.json();
        if (Array.isArray(animals) && animals.length > 0) {
            return animals[0];
        } else if (animals && animals.animal_id) {
            return animals;
        } else {
            return null;
        }
    }

    if (animalId) {
        fetchAnimalDetails(animalId)
            .then(animal => {
                if (animal && animal.animal_id) {
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
                            animal.medical_visits.map(m => `<li>${m.record_date || m.date_of_event || m.date || ''}: ${m.description || ''} (${m.treatment || ''})</li>`).join('') + '</ul>';
                    } else {
                        medicalHtml = '<h2>Medical Visits</h2><p>No medical records found.</p>';
                    }

                    let images = Array.isArray(animal.images) ? animal.images : (animal.images ? [animal.images] : []);
                    let currentImg = 0;
                    function renderCarousel() {
                        if (images.length === 0) return '';
                        let imgPath = images[currentImg];
                        let showArrows = images.length > 1;
                        return `
                            <div class="carousel-container">
                                ${showArrows ? '<button id="prev-img" class="carousel-arrow">&#8592;</button>' : ''}
                                <img id="animal-img" src="${imgPath}" alt="${animal.name}" class="carousel-img">
                                ${showArrows ? '<button id="next-img" class="carousel-arrow">&#8594;</button>' : ''}
                            </div>
                        `;
                    }

                    detailsDiv.innerHTML = `
                        ${renderCarousel()}
                        <h1>${animal.name}</h1>
                        <p><strong>Species:</strong> ${animal.species}</p>
                        <p><strong>Breed:</strong> ${animal.breed}</p>
                        <p><strong>Age:</strong> ${animal.age}</p>
                        <p><strong>Description:</strong> ${animal.description}</p>
                        ${feedingHtml}
                        ${medicalHtml}
                    `;

                    //navigare carusel 
                    if (images.length > 0) {
                        const img = document.getElementById('animal-img');
                        img.onerror = function() {
                            this.onerror = null;
                            this.src = '../assets/images/default.jpg';
                        };
                        const prevBtn = document.getElementById('prev-img');
                        const nextBtn = document.getElementById('next-img');
                        if (prevBtn) {
                            prevBtn.onclick = function() {
                                currentImg = (currentImg - 1 + images.length) % images.length;
                                img.src = images[currentImg];
                            };
                        }
                        if (nextBtn) {
                            nextBtn.onclick = function() {
                                currentImg = (currentImg + 1) % images.length;
                                img.src = images[currentImg];
                            };
                        }
                    }
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

    document.getElementById('adoption-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            alert('You must be logged in to submit an application.');
            return;
        }
        //iau id-ul animalului din URL
        const urlParams = new URLSearchParams(window.location.search);
        const petId = urlParams.get('id');
        if (!petId) {
            alert('No animal selected for adoption.');
            return;
        }
        //preiau datele din formular
        const form = e.target;
        const answers = {
            living_conditions: form['living_conditions'].value,
            animal_alone: form['animal_alone'].value,
            animal_scenario: form['animal_scenario'].value,
            animal_health: form['animal_health'].value
        };
        //iau detaliile animalului pt a afla owner_id
        let animal = null;
        try {
            animal = await fetchAnimalDetails(petId);
        } catch (err) {
            alert('Could not fetch pet owner info.');
            return;
        }
        if (!animal || !animal.owner_id) {
            alert('Could not determine the owner of this pet.');
            return;
        }
        //predau datele catre backend
        try {
            const response = await fetch('http://localhost/PoW-Project/backend/public/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    pet_id: petId,
                    applicant_id: userId,
                    owner_id: animal.owner_id,
                    answers: answers
                })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Your application has been submitted!');
                window.location.href = 'submitted-applications.html';
            } else {
                alert('Failed to submit application: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error submitting application: ' + err);
        }
    });
});
