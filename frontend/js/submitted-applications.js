// frontend/js/submitted-applications.js

console.log("Script loaded");
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    //inlocuiesc cu user_id din localStorage
    const userId = localStorage.getItem('user_id');
    const container = document.getElementById('applications-list');
    if (!container) {
        console.error('applications-list element not found');
        return;
    } else {
        console.log('applications-list element found');
    }
    if (!userId) {
        container.innerHTML = '<p>Please log in to view your applications.</p>';
        return;
    }
    const url = `http://localhost/PoW-Project/backend/public/api/applications/submitted?user_id=${userId}`;
    console.log("Fetching:", url);
    fetch(url, { credentials: 'include' })
        .then(res => {
            console.log('Fetch response status:', res.status);
            return res.json();
        })
        .then(applications => {
            console.log('Backend response:', applications); //debugging
            if (applications.error) {
                container.innerHTML = '<p>Please log in to view your applications.</p>';
                return;
            }
            if (!applications.length) {
                container.innerHTML = '<p>You have not submitted any applications yet.</p>';
                return;
            }
            container.innerHTML = applications.map(app => `
                <div class="application-card">
                    <h2>Application #${app.application_id}</h2>
                    <p><strong>Pet ID:</strong> ${app.pet_id}</p>
                    <p><strong>Status:</strong> ${app.status}</p>
                    <p><strong>Submitted:</strong> ${new Date(app.created_at).toLocaleString()}</p>
                    <button onclick="window.open('application-detail.html?id=${app.application_id}', '_blank')">View Details</button>
                </div>
            `).join('');
        })
        .catch(err => {
            container.innerHTML = '<p>Error loading applications.</p>';
            console.error('Fetch error:', err);
        });
});
