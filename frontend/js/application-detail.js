document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('id');
    const container = document.getElementById('application-detail');
    if (!appId) {
        container.innerHTML = '<p style="color:red">No application ID provided.</p>';
        return;
    }
    try {
        //iau detaliile aplicatiei de la backend
        const res = await fetch(`http://localhost/PoW-Project/backend/public/api/applications/${appId}`);
        const data = await res.json();
        if (!data || !data.application) {
            container.innerHTML = '<p style="color:red">Application not found.</p>';
            return;
        }
        const app = data.application;
        const pet = data.pet || {};
        const applicant = data.applicant || {};
        const owner = data.owner || {};
        //logica carusel
        let images = Array.isArray(pet.images) ? pet.images : (pet.images ? [pet.images] : []);
        let currentImg = 0;
        function renderCarousel() {
            if (images.length === 0) return '';
            let imgPath = images[currentImg];
            let showArrows = images.length > 1;
            return `
                <div class="carousel-container">
                    ${showArrows ? '<button id="prev-img" class="carousel-arrow">&#8592;</button>' : ''}
                    <img id="animal-img" src="${imgPath}" alt="${pet.name || ''}" class="carousel-img">
                    ${showArrows ? '<button id="next-img" class="carousel-arrow">&#8594;</button>' : ''}
                </div>
            `;
        }
        //feeding
        let feedingHtml = '';
        if (pet.feeding_journal && pet.feeding_journal.length > 0) {
            feedingHtml = '<h2>Feeding Journal</h2><ul>' +
                pet.feeding_journal.map(f => `<li>${f.feed_time}: ${f.food_type} (${f.notes || ''})</li>`).join('') + '</ul>';
        } else {
            feedingHtml = '<h2>Feeding Journal</h2><p>No feeding records found.</p>';
        }
        //medical
        let medicalHtml = '';
        if (pet.medical_visits && pet.medical_visits.length > 0) {
            medicalHtml = '<h2>Medical Visits</h2><ul>' +
                pet.medical_visits.map(m => `<li>${m.date_of_event || m.record_date || m.date || ''}: ${m.description || ''} (${m.treatment || ''})</li>`).join('') + '</ul>';
        } else {
            medicalHtml = '<h2>Medical Visits</h2><p>No medical records found.</p>';
        }
        // get current user id (assume localStorage.user_id)
        const currentUserId = localStorage.getItem('user_id');
        console.log('Current user id:', currentUserId, 'Owner id:', owner.id);
        //randez detaliile ca la adoptie
        container.innerHTML = `
            <section class="adopt-form-view">
                ${renderCarousel()}
                <h1>${pet.name || ''}</h1>
                <p><strong>Species:</strong> ${pet.species || ''}</p>
                <p><strong>Breed:</strong> ${pet.breed || ''}</p>
                <p><strong>Age:</strong> ${pet.age || ''}</p>
                <p><strong>Sex:</strong> ${pet.sex || ''}</p>
                <p><strong>Health:</strong> ${pet.health_status || ''}</p>
                <p><strong>Description:</strong> ${pet.description || ''}</p>
                ${feedingHtml}
                ${medicalHtml}
                <h2>Application Answers</h2>
                <form class="adopt-form-view" style="pointer-events:none;opacity:0.95;">
                    <label for="living-conditions">Describe your living conditions:</label><br>
                    <textarea id="living-conditions" readonly>${app.answers?.living_conditions || ''}</textarea><br>
                    <label for="animal-alone">How long will the animal be alone during the day?</label><br>
                    <input type="text" id="animal-alone" readonly value="${app.answers?.animal_alone || ''}"><br>
                    <label for="animal-scenario">How would you react if the animal damages something in your home?</label><br>
                    <textarea id="animal-scenario" readonly>${app.answers?.animal_scenario || ''}</textarea><br>
                    <label for="animal-health">What would you do if the animal gets sick?</label><br>
                    <textarea id="animal-health" readonly>${app.answers?.animal_health || ''}</textarea><br>
                </form>
                <h2>Applicant Details</h2>
                <p><strong>Name:</strong> ${applicant.full_name || applicant.username || ''}</p>
                <p><strong>Email:</strong> ${applicant.email || ''}</p>
                <h2>Owner Details</h2>
                <p><strong>Name:</strong> ${owner.full_name || owner.username || ''}</p>
                <p><strong>Email:</strong> ${owner.email || ''}</p>
                <div id="application-action-buttons" style="display:flex;justify-content:center;align-items:center;gap:20px;margin-top:30px;">
                    ${currentUserId && owner.id && String(currentUserId) === String(owner.id) ? `
                    <button id="reject-btn" class="adopt-form-view" style="background:#d1b3ff;color:#fff;min-width:120px;">Reject</button>
                    <button id="accept-btn" class="adopt-form-view" style="background:#6c3483;color:#fff;min-width:120px;">Accept</button>
                    ` : ''}
                </div>
            </section>
        `;
        //logica carusel
        if (images.length > 0) {
            const img = document.getElementById('animal-img');            img.onerror = function() {
                this.onerror = null;
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
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
        //logica butoanelor de accept/reject
        const acceptBtn = document.getElementById('accept-btn');
        const rejectBtn = document.getElementById('reject-btn');
        // hide buttons if already decided
        if (app.status === 'accepted' || app.status === 'rejected') {
            document.getElementById('application-action-buttons').innerHTML = `<span style="color:${app.status==='accepted'?'#4caf50':'#d32f2f'};font-weight:bold;">Application ${app.status.charAt(0).toUpperCase()+app.status.slice(1)}!</span>`;
        } else {
            function updateStatus(newStatus) {
                fetch(`http://localhost/PoW-Project/backend/public/api/applications/${appId}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                })
                .then(res => res.json())
                .then(result => {
                    if (result && !result.error) {
                        document.getElementById('application-action-buttons').innerHTML = `<span style=\"color:${newStatus==='accepted'?'#4caf50':'#d32f2f'};font-weight:bold;\">Application ${newStatus.charAt(0).toUpperCase()+newStatus.slice(1)}!</span>`;
                    } else {
                        alert(result.error || 'Failed to update status');
                    }
                })
                .catch(() => alert('Failed to update status'));
            }
            if (acceptBtn) acceptBtn.onclick = () => updateStatus('accepted');
            if (rejectBtn) rejectBtn.onclick = () => updateStatus('rejected');
        }
    } catch (err) {
        container.innerHTML = `<p style=\"color:red\">Error loading application details: ${err}</p>`;
    }
});
