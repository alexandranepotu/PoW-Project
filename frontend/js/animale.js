console.log("animale.js loaded successfully");

//init chat manager
let chatManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Content Loaded");
  
  if (!window.chatManager) {
      window.chatManager = new ChatManager();
  }
  chatManager = window.chatManager;
  
  const form = document.getElementById('filterForm');
  const list = document.getElementById('animalList');

  if (!form) {
    console.error("Filter form not found");
    return;
  }
  
  if (!list) {
    console.error("Animal list container not found");
    return;
  }
  
  console.log("All elements found");

  function loadAnimals(params = '') {
    console.log("Loading animals with params:", params);
      //daca nu am filtre, incarc toate animalele
    //daca am filtre, nu mai folosesc action=getAvailable
    let url;
    if (params && params.trim() !== '') {
      //pt filtrare, folosesc parametrii din form
      url = `/PoW-Project/backend/public/api/animals?${params}`;
      console.log("Filtering with params");
    } else {//incarcare initiala
      url = `/PoW-Project/backend/public/api/animals?action=getAvailable`;
      console.log("Loading all available animals");
    }
    
    console.log("Fetching from:", url);

    //mesaj de incarcare
    list.innerHTML = '<p style="color: blue; text-align: center; padding: 20px;">Loading animals...</p>';

    fetch(url)
      .then(response => {
        console.log("Response status:", response.status);
        console.log("Response headers:", [...response.headers.entries()]);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.text();
      })
      .then(rawText => {
        console.log("Raw response:", rawText);
        
        let data;
        try {
          data = JSON.parse(rawText);
          console.log("Parsed JSON:", data);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          list.innerHTML = `
            <div style="color: red; padding: 15px; border: 1px solid red; border-radius: 5px;">
              <h3>JSON Parse Error</h3>
              <p>Server response is not valid JSON:</p>
              <pre style="background: #f5f5f5; padding: 10px; overflow: auto; font-size: 12px;">${rawText}</pre>
            </div>
          `;
          return;
        }
        
        //dau clear la lista
        list.innerHTML = '';
        
        if (!Array.isArray(data)) {
          console.log("Data is not an array:", typeof data, data);
          list.innerHTML = `<p style="color: red;">Expected array but received ${typeof data}</p>`;
          return;
        }
        
        //scot animlele adaugate de utilizatorul logat
        const userId = localStorage.user_id || localStorage.id;
        const filteredData = data.filter(animal => String(animal.added_by) !== String(userId));
        if (filteredData.length === 0) {
          list.innerHTML = '<p style="color: orange; text-align: center; padding: 20px;">No animals found matching your criteria.</p>';
          return;
        }
        console.log(`Displaying ${filteredData.length} animals (excluding user's own)`);
        
        //creare carduri pt fiecare animal
        filteredData.forEach((animal, index) => {
          console.log(`Creating card for animal ${index + 1}:`, animal);
          
          const card = document.createElement('article');
          card.className = 'adoption-card';
          
          const name = animal.name || 'Unnamed';
          const species = animal.species || 'Unknown';          const breed = animal.breed || 'Mixed';
          const age = animal.age || 'Unknown';
          const sex = animal.sex || 'Unknown';
          const health = animal.health_status || 'Unknown';
          const mediaUrl = animal.media_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
          
          card.innerHTML = `
            <img src="${mediaUrl}" 
                 alt="${species}" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='" />
            
            <h3>${name} (${species})</h3>
            
            <div class="animal-details">
              <p><strong>Breed:</strong> ${breed}</p>
              <p><strong>Age:</strong> ${age}</p>
              <p><strong>Sex:</strong> ${sex}</p>
              <p><strong>Health:</strong> ${health}</p>
            </div>
              <div class="animal-actions">
              <button class="adopt-btn" onclick="adoptAnimal('${animal.animal_id || ''}', '${name}')">
                🐾 Adopt ${name}
              </button>
              <button class="chat-btn" onclick="window.chatManager.createChatRoom('${animal.animal_id || ''}')">
                💬 Chat with Owner
              </button>
            </div>
          `;
          
          list.appendChild(card);
        });
        
        console.log(`Successfully displayed ${data.length} animals`);
      })
      .catch(error => {
        console.error("Fetch error:", error);
        list.innerHTML = `
          <div style="color: red; padding: 20px; border: 2px solid red; border-radius: 10px; background: #ffe6e6; margin: 20px 0;">
            <h3>Connection Error</h3>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>URL:</strong> ${url}</p>
            <div style="margin-top: 15px;">
              <h4>Troubleshooting Steps:</h4>
              <ol style="text-align: left;">
                <li>Make sure XAMPP is running (Apache & MySQL)</li>
                <li>Test this URL directly: <a href="${url}" target="_blank" style="color: blue;">${url}</a></li>
                <li>Check if your database has animals with available = TRUE</li>
                <li>Check PHP error logs in XAMPP</li>
              </ol>
            </div>
            <button onclick="location.reload()" style="background: #dc3545; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              Retry
            </button>
          </div>
        `;
      });
  }

  //functie de adoptie
  window.adoptAnimal = function(animalId, animalName) {
    if (!animalId) {
      alert('Animal ID not available');
      return;
    }
    //redirect la pagina de adoptie cu id-ul animalului
    window.location.href = `adopt.html?id=${animalId}`;
  };

  //incarc initial animalele
  console.log("Starting initial animal load...");
  loadAnimals();

  //pt form de filtrare
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Form submitted for filtering");
    
    const formData = new FormData(form);
    const params = new URLSearchParams(formData).toString();
    console.log("Filter parameters:", params);
    
    loadAnimals(params);
  });

  console.log("All setup complete!");
});
