async function loadFeed() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorContainer = document.getElementById('errorContainer');
    const petsSection = document.getElementById('pets');
    const newsSection = document.getElementById('news');

    //reset la UI
    loadingIndicator.style.display = 'block';
    errorContainer.style.display = 'none';
    errorContainer.textContent = '';
    petsSection.innerHTML = '<h2>🐾 Available Pets</h2>';
    newsSection.innerHTML = '<h2>📰 Latest News</h2>';
    
    try {
        //iau animalele din bd
        const petsResponse = await fetch('/PoW-Project/backend/public/api/pets', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!petsResponse.ok) {
            throw new Error(`HTTP error! status: ${petsResponse.status}`);
        }
        
        const petsData = await petsResponse.json();
        console.log('Pets data:', petsData);

        if (!petsData.success) {
            throw new Error('Failed to fetch pets data');
        }
        
        //iau stirile din bd
        const newsResponse = await fetch('/PoW-Project/backend/public/api/news', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!newsResponse.ok) {
            throw new Error(`HTTP error! status: ${newsResponse.status}`);
        }
        
        const newsData = await newsResponse.json();
        console.log('News data:', newsData);

        if (!newsData.success) {
            throw new Error('Failed to fetch news data');
        }
        
        //rendez animlalele
        if (petsData.pets && petsData.pets.length > 0) {
            petsData.pets.forEach(pet => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'feed-item';
                
                itemDiv.innerHTML = `
                    <h3><a href="animal.html?id=${pet.animal_id}">${pet.name}</a></h3>
                    <div class="date">Posted: ${new Date(pet.created_at).toLocaleString()}</div>
                    ${pet.media_url ? `<img src="${pet.media_url}" alt="${pet.name}" class="pet-image"/>` : ''}
                    <div class="description">
                        <ul>
                            <li><strong>Species:</strong> ${pet.species}</li>
                            <li><strong>Breed:</strong> ${pet.breed || 'Not specified'}</li>
                            <li><strong>Age:</strong> ${pet.age}</li>
                            <li><strong>Location:</strong> ${pet.pickup_address}</li>
                        </ul>
                        ${pet.description ? `<p>${pet.description}</p>` : ''}
                    </div>
                    ${pet.owner_name ? `<div class="meta">Posted by: ${pet.owner_name}</div>` : ''}
                `;
                
                petsSection.appendChild(itemDiv);
            });
        } else {
            petsSection.innerHTML += '<p class="no-items">No pets available at the moment.</p>';
        }

        //rendez stirile
        if (newsData.news && newsData.news.length > 0) {
            newsData.news.forEach(newsItem => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'feed-item';
                
                itemDiv.innerHTML = `
                    <h3>${newsItem.title}</h3>
                    <div class="date">Posted: ${new Date(newsItem.created_at).toLocaleString()}</div>
                    <div class="description">${newsItem.content}</div>
                    ${newsItem.author_name ? `<div class="meta">Posted by: ${newsItem.author_name}</div>` : ''}
                `;
                
                newsSection.appendChild(itemDiv);
            });
        } else {
            newsSection.innerHTML += '<p class="no-items">No news available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        errorContainer.textContent = `Error loading content: ${error.message}. Please try again.`;
        errorContainer.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

//init cand se incarca DOM
document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
});
