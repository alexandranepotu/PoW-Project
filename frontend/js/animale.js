document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('filterForm');
  const list = document.getElementById('animalList');

  function loadAnimals(params = '') {
    fetch(`get_animale.php?${params}`)
      .then(res => res.json())
      .then(data => {
        list.innerHTML = '';
        if (data.length > 0) {
          data.forEach(row => {
            const card = document.createElement('article');
            card.className = 'animal-card';
            card.innerHTML = `
              <img src="${row.imagine_url}" alt="${row.type1}">
              <h2>${row.type1} - ${row.nume}</h2>
              <p>Age: ${row.age} years</p>
              <p>Personality: ${row.personality}</p>
              <button>Adopt</button>
            `;
            list.appendChild(card);
          });
        } else {
          list.innerHTML = '<p>There are no animals for that filter.</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching animals:', error);
        list.innerHTML = '<p>Could not load animals. Please try again later.</p>';
      });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form)).toString();
    loadAnimals(params);
  });

  //load initial
  loadAnimals();
});
