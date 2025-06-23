console.log("Script loaded");
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded event fired");
    
    const container = document.getElementById('applications-list');
    if (!container) {
        console.error('applications-list element not found');
        return;
    } else {
        console.log('applications-list element found');
    }
    
    try {
        const userResponse = await fetch('/PoW-Project/backend/public/api/auth/check-admin', {
            credentials: 'include'
        });
        
        if (!userResponse.ok) {
            container.innerHTML = '<p>Please log in to view your applications.</p>';
            return;
        }
        
        const userData = await userResponse.json();
        const userId = userData.user_id;
        
        if (!userId) {
            container.innerHTML = '<p>Please log in to view your applications.</p>';
            return;
        }
        
        const url = `/PoW-Project/backend/public/api/applications/submitted?user_id=${userId}`;
        console.log("Fetching:", url);
        
        const response = await fetch(url, { credentials: 'include' });
        console.log('Fetch response status:', response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (!responseText.trim()) {
            throw new Error('Empty response from server');
        }
        
        let applications;
        try {
            applications = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response text that failed to parse:', responseText);
            throw new Error('Invalid JSON response from server');
        }
          
        if (applications.error) {
            container.innerHTML = '<p>Error: ' + applications.error + '</p>';
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
        
    } catch (error) {
        container.innerHTML = '<p>Error loading applications: ' + error.message + '</p>';
        console.error('Error:', error);
    }
});
