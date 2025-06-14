const addBtn = document.querySelector('.btn-add');
const modal = document.getElementById('addPetModal');
const closeBtn = modal.querySelector('.close-btn');
const form = document.getElementById('addPetForm');

const mediaList = document.getElementById('mediaResourcesList');
const feedingList = document.getElementById('feedingList');
const medicalList = document.getElementById('medicalList');

const btnAddMedia = document.getElementById('btnAddMedia');
const btnAddFeeding = document.getElementById('btnAddFeeding');
const btnAddMedical = document.getElementById('btnAddMedical');

// Deschide ->click pe Add
addBtn.addEventListener('click', () => {
  modal.style.display = 'flex';
});

// inchide la click x
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// inchide la click in afara modalului
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

//fct comuna-> creare buton Remove
function createRemoveBtn() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Remove';
  btn.className = 'btn-remove-entry';
  btn.addEventListener('click', (e) => {
    e.target.parentElement.remove();
  });
  return btn;
}

// media entry
btnAddMedia.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'media-entry';

  const inputFile = document.createElement('input');
  inputFile.type = 'file';
  inputFile.name = 'mediaFiles[]';
  inputFile.accept = 'image/*,video/*';

  const inputDesc = document.createElement('input');
  inputDesc.type = 'text';
  inputDesc.name = 'mediaDescriptions[]';
  inputDesc.placeholder = 'Descriere media';

  div.appendChild(inputFile);
  div.appendChild(inputDesc);
  div.appendChild(createRemoveBtn());

  mediaList.appendChild(div);
});

//feeding entry
btnAddFeeding.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'feeding-entry';

  const labelTime = document.createElement('label');
  labelTime.textContent = 'Feed Time: ';
  const inputTime = document.createElement('input');
  inputTime.type = 'time';
  inputTime.name = 'feedTime[]';
  inputTime.required = true;
  labelTime.appendChild(inputTime);

  const labelFood = document.createElement('label');
  labelFood.textContent = 'Food Type: ';
  const inputFood = document.createElement('input');
  inputFood.type = 'text';
  inputFood.name = 'foodType[]';
  inputFood.required = true;
  labelFood.appendChild(inputFood);

  const labelNotes = document.createElement('label');
  labelNotes.textContent = 'Notes: ';
  const inputNotes = document.createElement('input');
  inputNotes.type = 'text';
  inputNotes.name = 'feedNotes[]';
  labelNotes.appendChild(inputNotes);

  div.appendChild(labelTime);
  div.appendChild(labelFood);
  div.appendChild(labelNotes);
  div.appendChild(createRemoveBtn());

  feedingList.appendChild(div);
});

//medical record entry
btnAddMedical.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'medical-entry';

  const labelDate = document.createElement('label');
  labelDate.textContent = 'Date: ';
  const inputDate = document.createElement('input');
  inputDate.type = 'date';
  inputDate.name = 'medicalDate[]';
  inputDate.required = true;
  labelDate.appendChild(inputDate);

  const labelDesc = document.createElement('label');
  labelDesc.textContent = 'Description: ';
  const inputDesc = document.createElement('input');
  inputDesc.type = 'text';
  inputDesc.name = 'medicalDescription[]';
  inputDesc.required = true;
  labelDesc.appendChild(inputDesc);

  const labelTreatment = document.createElement('label');
  labelTreatment.textContent = 'Treatment: ';
  const inputTreatment = document.createElement('input');
  inputTreatment.type = 'text';
  inputTreatment.name = 'medicalTreatment[]';
  labelTreatment.appendChild(inputTreatment);

  const labelEmergency = document.createElement('label');
  labelEmergency.textContent = 'Emergency: ';
  const selectEmergency = document.createElement('select');
  selectEmergency.name = 'medicalEmergency[]';
  const optionNo = document.createElement('option');
  optionNo.value = 'no';
  optionNo.textContent = 'No';
  const optionYes = document.createElement('option');
  optionYes.value = 'yes';
  optionYes.textContent = 'Yes';
  selectEmergency.appendChild(optionNo);
  selectEmergency.appendChild(optionYes);
  labelEmergency.appendChild(selectEmergency);

  div.appendChild(labelDate);
  div.appendChild(labelDesc);
  div.appendChild(labelTreatment);
  div.appendChild(labelEmergency);
  div.appendChild(createRemoveBtn());

  medicalList.appendChild(div);
});

// Trimite formularul
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const petData = {
    name: form.petName.value.trim(),
    species: form.species.value.trim(),
    breed: form.breed.value.trim(),
    age: form.age.value,
    healthStatus: form.healthStatus.value.trim(),
    description: form.description.value.trim(),
    media: [],       // aduna media info
    feedings: [],    // aduna feedings info
    medical: []      // aduna medical records info
  };

  // Exemplu simplificat de colectare media descriptions 
  const mediaDescs = form.querySelectorAll('input[name="mediaDescriptions[]"]');
  mediaDescs.forEach(input => {
    petData.media.push({ description: input.value });
  });

  // Feeding info
  const feedTimes = form.querySelectorAll('input[name="feedTime[]"]');
  const foodTypes = form.querySelectorAll('input[name="foodType[]"]');
  const feedNotes = form.querySelectorAll('input[name="feedNotes[]"]');
  for(let i=0; i<feedTimes.length; i++) {
    petData.feedings.push({
      feedTime: feedTimes[i].value,
      foodType: foodTypes[i].value,
      notes: feedNotes[i].value
    });
  }

  // Medical info
  const medicalDates = form.querySelectorAll('input[name="medicalDate[]"]');
  const medicalDescs = form.querySelectorAll('input[name="medicalDescription[]"]');
  const medicalTreatments = form.querySelectorAll('input[name="medicalTreatment[]"]');
  const medicalEmergencies = form.querySelectorAll('select[name="medicalEmergency[]"]');
  for(let i=0; i<medicalDates.length; i++) {
    petData.medical.push({
      date: medicalDates[i].value,
      description: medicalDescs[i].value,
      treatment: medicalTreatments[i].value,
      emergency: medicalEmergencies[i].value
    });
  }

  console.log('Pet added:', petData);
  alert(`You added a new pet: ${petData.name} (${petData.species})`);

  form.reset();
  mediaList.innerHTML = '';
  feedingList.innerHTML = '';
  medicalList.innerHTML = '';
  modal.style.display = 'none';
});
