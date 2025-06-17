  document.getElementById('filterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const params = new URLSearchParams(new FormData(this)).toString();
  fetch('PetPageModel.php?' + params)
    .then(response => response.json())
    .then(data => {
      const list = document.getElementById('animalList');
      list.innerHTML = '';
      if (data.length === 0) {
        list.innerHTML = '<p>No animals found.</p>';
        return;
      }
      data.forEach(animal => {
        const card = document.createElement('article');
        card.className = 'animal-card';
        card.innerHTML = `
          <h2>${animal.species} - ${animal.breed}</h2>
          <p>Age: ${animal.age}</p>
          <p>Sex: ${animal.sex}</p>
          <p>Health Status: ${animal.health_status}</p>
        `;
        list.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
});
