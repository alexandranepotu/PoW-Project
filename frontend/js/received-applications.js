document.addEventListener('DOMContentLoaded', () => {
    //inlocuiesc cu user_id din localStorage
    const userId = localStorage.getItem('user_id');
    const container = document.getElementById('applications-list');
    if (!userId) {
        container.innerHTML = '<p>Please log in to view received applications.</p>';
        return;
    }
    fetch(`http://localhost/PoW-Project/backend/public/api/applications/received?user_id=${userId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(applications => {
            console.log('Backend response:', applications); //debugging
            if (applications.error) {
                container.innerHTML = '<p>Please log in to view received applications.</p>';
                return;
            }
            if (!applications.length) {
                container.innerHTML = '<p>You have not received any applications yet.</p>';
                return;
            }
            container.innerHTML = applications.map(app => `
                <div class="application-card">
                    <h2>Application #${app.application_id}</h2>
                    <p><strong>Pet ID:</strong> ${app.pet_id}</p>
                    <p><strong>Applicant ID:</strong> ${app.applicant_id}</p>
                    <p><strong>Status:</strong> ${app.status}</p>
                    <p><strong>Submitted:</strong> ${new Date(app.created_at).toLocaleString()}</p>
                    <button onclick="window.open('application-detail.html?id=${app.application_id}', '_blank')">View Details</button>
                </div>
            `).join('');
        })
        .catch(err => {
            container.innerHTML = '<p>Error loading applications.</p>';
            console.error(err);
        });
});
