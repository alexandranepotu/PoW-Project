document.addEventListener('DOMContentLoaded', () => {
    const petsList = document.getElementById('petsList');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const username = urlParams.get('username');

    if (!userId) {
        petsList.innerHTML = '<p class="error">No user ID provided</p>';
        return;
    }

    // Update the title to include the username
    if (username) {
        const title = document.querySelector('h1');
        if (title) {
            title.textContent = `${decodeURIComponent(username)}'s Pets`;
        }
    }    // Add a back button with modern styling
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Admin Panel
    `;
    backButton.onclick = () => window.location.href = 'admin.html';
    document.querySelector('main').insertBefore(backButton, document.querySelector('h1'));

    //tena
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    //functionalitate de schimbare a temei
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    //actualizare titlu cu numele utilizatorului
    if (username) {
        const title = document.querySelector('h1');
        if (title) {
            title.textContent = `${decodeURIComponent(username)}'s Pets`;
        }
    }

    //animalele utilizatorului
    fetch(`/PoW-Project/backend/public/api/animals?action=getUserPets&userId=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(response => {
            if (!response || response.error) {
                throw new Error(response?.error || 'Invalid response from server');
            }

            const data = Array.isArray(response) ? response : (response.pets || []);
            
            if (data.length === 0) {
                petsList.innerHTML = '<p class="no-pets">This user has not put any pets up for adoption.</p>';
                return;
            }

            //afisarea animalelor
            data.forEach(pet => {
                const petCard = document.createElement('div');
                petCard.className = 'pet-card';
                
                const mediaUrl = pet.media_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

                petCard.innerHTML = `
                    <img src="${mediaUrl}" 
                         alt="${pet.name}" 
                         class="pet-image"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                    <div class="pet-info">
                        <h3>${pet.name || 'Unnamed Pet'}</h3>
                        <p><strong>Species:</strong> ${pet.species || 'Not specified'}</p>
                        <p><strong>Breed:</strong> ${pet.breed || 'Not specified'}</p>
                        <p><strong>Age:</strong> ${pet.age || 'Not specified'}</p>
                        <p><strong>Health Status:</strong> ${pet.health_status || 'Not specified'}</p>
                        <p><strong>Status:</strong> ${pet.available ? 'Available' : 'Not Available'}</p>
                    </div>
                `;
                
                petsList.appendChild(petCard);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            petsList.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Pets</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="retry-btn">
                        Try Again
                    </button>
                </div>
            `;
        });
});
