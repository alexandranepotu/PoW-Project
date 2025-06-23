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
    }    if (animalId) {
        fetchAnimalDetails(animalId)
            .then(animal => {
                if (animal && animal.animal_id) {
                    let feedingHtml = '';
                    if (animal.feeding_journal && animal.feeding_journal.length > 0) {
                        feedingHtml = '<h2>Feeding Journal</h2><ul>' +
                            animal.feeding_journal.map(f => `<li>${f.feed_time}: ${f.food_type} (${f.notes || ''})</li>`).join('') + '</ul>';
                    } else {
                        feedingHtml = '<h2>Feeding Journal</h2><p>No feeding records found.</p>';
                    }                    let medicalHtml = '';
                    if (animal.medical_visits && animal.medical_visits.length > 0) {
                        medicalHtml = '<h2>Medical Visits</h2><ul>' +
                            animal.medical_visits.map(m => `<li>${SharedUtilities.formatDate(m.record_date || m.date_of_event || m.date) || 'Unknown date'}: ${SharedUtilities.escapeHtml(m.description || '')} ${m.treatment ? `(${SharedUtilities.escapeHtml(m.treatment)})` : ''}</li>`).join('') + '</ul>';
                    } else {
                        medicalHtml = '<h2>Medical Visits</h2><p>No medical records found.</p>';
                    }// Prepare media for display
                    let images = Array.isArray(animal.images) ? animal.images : (animal.images ? [animal.images] : []);
                    let videos = Array.isArray(animal.videos) ? animal.videos : (animal.videos ? [animal.videos] : []);
                    
                    // Create simple image display (use first image if available)
                    let imageHtml = '';
                    if (images.length > 0) {
                        imageHtml = `<div class="carousel-container">
                            <img src="${images[0]}" alt="${SharedUtilities.escapeHtml(animal.name)}" class="carousel-img" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                        </div>`;
                    } else {
                        imageHtml = `<div class="carousel-container">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==" alt="No Image" class="carousel-img">
                        </div>`;
                    }                    detailsDiv.innerHTML = `
                        ${imageHtml}
                        <h1>${SharedUtilities.escapeHtml(animal.name || 'Unknown name')}</h1>
                        <p><strong>Species:</strong> ${SharedUtilities.escapeHtml(animal.species || 'Unknown')}</p>
                        <p><strong>Breed:</strong> ${SharedUtilities.escapeHtml(animal.breed || 'Unknown')}</p>
                        <p><strong>Age:</strong> ${SharedUtilities.escapeHtml(animal.age || 'Unknown')}</p>
                        <p><strong>Description:</strong> ${SharedUtilities.escapeHtml(animal.description || 'No description available')}</p>
                        ${feedingHtml}
                        ${medicalHtml}
                    `;
                } else {
                    detailsDiv.innerHTML = SharedUtilities.createErrorMessage('Animal not found', false);
                }
            })
            .catch((error) => {
                console.error('Error loading animal details:', error);
                detailsDiv.innerHTML = SharedUtilities.createErrorMessage('Error loading animal details');
            });
    } else {
        detailsDiv.innerHTML = SharedUtilities.createEmptyMessage('No animal selected');
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
