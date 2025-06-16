class MyPetsManager {
    constructor() {
        this.currentPetId = null;
        this.pets = [];
        this.domManager = new MyPetsDOMManager();
        this.renderer = new MyPetsRenderer();
        this.init();
    }

    async init() {
        await this.loadMyPets();
        this.setupEventListeners();
    }
    //pt gestionarea eventurilor
     setupEventListeners() {
        const addBtn = document.querySelector('.btn-add');
        const modal = document.getElementById('addPetModal');
        const closeBtn = modal?.querySelector('.close-btn');
        const form = document.getElementById('addPetForm');
        
        // sa nu fie deschis automat modalul
        if (modal) {
            modal.style.display = 'none';
        }if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
                this.setupFormEntryManagement();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleAddPet(e));
        }
        
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }    async loadMyPets() {   //incarcare + afisare animale
        try {
            const response = await fetch('/PoW-Project/backend/public/api/mypets', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.pets = data.pets || [];
                this.renderPetsList(this.pets);  //afisez lissta animalelor
                this.renderStatistics(data.statistics || {}); //statistici->tb???????
            } else if (response.status === 401) {
                this.showMessage('You must authenticate', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                const errorData = await response.text();
                throw new Error('Failed to load pets: ' + response.status);
            }
        } catch (error) {
            this.showMessage('Error loading pets: ' + error.message, 'error');
        }
    }
      renderPetsList(pets) {
        const container = this.domManager.getPetsContainer();
        container.innerHTML = this.renderer.renderPetsList(pets);
    }
    
    createPetsContainer() {
        return this.domManager.createPetsContainer();
    }    renderStatistics(stats) {
        const container = this.domManager.getStatsContainer();
        container.innerHTML = this.renderer.renderStatistics(stats);
    }
    
    createStatsContainer() {
        return this.domManager.createStatsContainer();
    }
      async viewPetDetails(petId) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showPetDetailsModal(data.pet);  //afisare modal cu detalii
            } else {
                throw new Error('Failed to load pet details');
            }
        } catch (error) {
            this.showMessage('Error loading pet details', 'error');
        }
    }
      showPetDetailsModal(pet) {
        const modal = this.domManager.createModal('petDetailsModal', 'Pet details - ' + pet.name);
        modal.querySelector('.modal-body').innerHTML = this.renderer.renderPetDetails(pet);
        this.domManager.setupTabSwitching(modal);
        this.currentPetId = pet.animal_id;
    }
      renderFeedingRecords(records) {
        return this.renderer.renderFeedingRecords(records);
    }
    
    renderMedicalRecords(records) {
        return this.renderer.renderMedicalRecords(records);
    }
    
    renderMediaGallery(media) {
        return this.renderer.renderMediaGallery(media);
    }
      setupTabSwitching(modal) {
        this.domManager.setupTabSwitching(modal);
    }
    
    createModal(id, title) {
        return this.domManager.createModal(id, title);
    }    showAddFeedingForm(petId) {
        const modal = this.createModal('addFeedingModal', 'Add Feeding Records - Multiple Entries');
        modal.querySelector('.modal-body').innerHTML = MyPetsTemplates.feedingForm();
        
        let entryCount = 0; 
        //mai multe inregistrarile de feeding
        modal.querySelector('#addMoreFeeding').addEventListener('click', () => {
            entryCount++;
            const feedingEntries = modal.querySelector('#feedingEntries');
            this.domManager.addFeedingEntry(feedingEntries, entryCount);
        });
          
        modal.querySelector('#addFeedingForm').addEventListener('submit', (e) => {
            this.handleMultipleFeeding(e, petId);
        });
    }

    async handleMultipleFeeding(e, petId) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const today = new Date().toISOString().split('T')[0]; //data curenta
        
        //toate inregistrarile
        const feedingRecords = [];
        let index = 0;
        
        while (formData.has(`feed_time_${index}`)) {
            const feedTime = formData.get(`feed_time_${index}`);
            const foodType = formData.get(`food_type_${index}`);
            
            if (feedTime && foodType) {
                // Combine current date with the time
                const fullDateTime = `${today}T${feedTime}:00`;
                
                feedingRecords.push({
                    feed_time: fullDateTime,
                    food_type: foodType,
                    notes: formData.get(`notes_${index}`) || ''
                });
            }
            index++;
        }
        
        //trimite toate inregistrarile 
        try {
            for (const record of feedingRecords) {
                const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}/feeding`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to add feeding record');
                }
            }
            
            this.showMessage(`${feedingRecords.length} feeding records added successfully!`, 'success');
            document.getElementById('addFeedingModal').remove();
            this.viewPetDetails(petId);
            
        } catch (error) {
            this.showMessage('Error adding feeding records', 'error');
        }
    }    showAddMedicalForm(petId) {
        const modal = this.createModal('addMedicalModal', 'Add Medical Records - Multiple Entries');
        modal.querySelector('.modal-body').innerHTML = MyPetsTemplates.medicalForm();
        
        let entryCount = 0;
        
        //add inregistrari medicale
        modal.querySelector('#addMoreMedical').addEventListener('click', () => {
            entryCount++;
            const medicalEntries = modal.querySelector('#medicalEntries');
            this.domManager.addMedicalEntry(medicalEntries, entryCount);
        });
        
        modal.querySelector('#addMedicalForm').addEventListener('submit', (e) => {
            this.handleMultipleMedical(e, petId);
        });
    }
    async handleMultipleMedical(e, petId) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
      //colecteaza toate inregistrarile medicale
        const medicalRecords = [];
        let index = 0;
        
        while (formData.has(`date_of_event_${index}`)) {
            const eventDate = formData.get(`date_of_event_${index}`);
            const description = formData.get(`description_${index}`);
            
            if (eventDate && description) {
                medicalRecords.push({
                    date_of_event: eventDate,
                    description: description,
                    treatment: formData.get(`treatment_${index}`) || '',
                    emergency: formData.has(`emergency_${index}`)
                });
            }
            index++;
        }
        try {    //trimite fiecare inregistrare in parte
            for (const record of medicalRecords) {
                const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}/medical`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to add medical record');
                }
            }
            this.showMessage(`${medicalRecords.length} medical records added successfully!`, 'success');
            document.getElementById('addMedicalModal').remove();
            this.viewPetDetails(petId);     
        } catch (error) {
            this.showMessage('Error adding medical records', 'error');
        }
    }    showUploadForm(petId) {
        const modal = this.createModal('uploadModal', 'Upload Media - Multiple Files');
        modal.querySelector('.modal-body').innerHTML = MyPetsTemplates.uploadForm();
        
        modal.querySelector('#mediaFiles').addEventListener('change', (e) => {
            this.domManager.createMediaPreview(e.target.files, modal.querySelector('#uploadPreviews'));
        });
        
        modal.querySelector('#uploadForm').addEventListener('submit', (e) => {
            this.handleMultipleUpload(e, petId);
        });
    }    // foloseste DOM Manager pentru preview
    previewMultipleFiles(files, container) {
        this.domManager.createMediaPreview(files, container);
    }
    async handleMultipleUpload(e, petId) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const files = e.target.querySelector('#mediaFiles').files;
        const globalDescription = formData.get('global_description') || '';
        
        // Uploadla fiecare fisier in parte
        const uploadPromises = Array.from(files).map(async (file, index) => {
            const fileFormData = new FormData();
            fileFormData.append('file', file);
            
            // descrierea individuala
            const individualDescription = formData.get(`description_${index}`) || globalDescription;
            if (individualDescription) {
                fileFormData.append('description', individualDescription);
            }
            
            try {
                const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}/media`, {
                    method: 'POST',
                    body: fileFormData,
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }
                
                return { success: true, filename: file.name };
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                return { success: false, filename: file.name, error: error.message };
            }
        });
        
        try {
            const results = await Promise.all(uploadPromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            if (successful.length > 0) {
                this.showMessage(`${successful.length} files uploaded successfully!`, 'success');
            }
            
            if (failed.length > 0) {
                this.showMessage(`${failed.length} files failed to upload: ${failed.map(f => f.filename).join(', ')}`, 'error');
            }
            
            document.getElementById('uploadModal').remove();
            this.viewPetDetails(petId);
            
        } catch (error) {
            console.error('Error during multiple upload:', error);
            this.showMessage('Error uploading files', 'error');
        }
    }
    
    async deleteFeedingRecord(feedId) {
        if (!confirm('Are you sure you want to delete this feeding record?')) return;
        
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/feeding/${feedId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.showMessage('Record deleted succesfully!', 'success');
                this.viewPetDetails(this.currentPetId);
            } else {
                throw new Error('Failed to delete feeding record');
            }
        } catch (error) {
            console.error('Error deleting feeding record:', error);
            this.showMessage('Error deleting feeding record', 'error');
        }
    }
    
    async deleteMedicalRecord(recordId) {
        if (!confirm('Are you sure you want to delete this medical record?')) return;
        
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/medical/${recordId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.showMessage('Medical record deleted succesfully!', 'success');
                this.viewPetDetails(this.currentPetId);
            } else {
                throw new Error('Failed to delete medical record');
            }
        } catch (error) {
            console.error('Error deleting medical record:', error);
            this.showMessage('Error deleting medical record', 'error');
        }
    }
    
    async deleteMedia(mediaId) {
        if (!confirm('Are you sure you want to delete this media file?')) return;
        
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/media/${mediaId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.showMessage('Media file deleted succesfully!', 'success');
                this.viewPetDetails(this.currentPetId);
            } else {
                throw new Error('Failed to delete media');
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            this.showMessage('Error deleting media', 'error');
        }
    }
    
    async editPet(petId) {
        this.showMessage('Editing functionality will be implemented soon', 'info');
    }
    
    async deletePet(petId) {
        if (!confirm('Are you sure you can delete this animal? This action cannot be undone and will delete all associated data.')) return;
        
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.showMessage('Pet deleted succesfully!', 'success');
                this.loadMyPets();
            } else {
                throw new Error('Failed to delete pet');
            }
        } catch (error) {
            console.error('Error deleting pet:', error);
            this.showMessage('Error deleting pet', 'error');
        }
    } 
    async handleAddPet(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // calculeaza varsta cu ani si luni-> poate ar trebui modificat??????????????????/
        const ageYears = parseInt(formData.get('ageYears')) || 0;
        const ageMonths = parseInt(formData.get('ageMonths')) || 0;
        const totalAge = ageYears + (ageMonths / 12);
        
        //ia datele din formular
        const petData = {
            name: formData.get('petName'),
            species: formData.get('species'),
            breed: formData.get('breed') || '',
            age: totalAge > 0 ? totalAge : null,
            sex: formData.get('sex') || null,
            health_status: formData.get('healthStatus') || '',
            description: formData.get('description') || ''
        };
        
        //validare date obligatorii
        if (!petData.name || !petData.species) {
            this.showMessage('Please fill in the required fields (Name and Species)', 'error');
            return;
        }

        //ia datele de hranire
        const feedings = this.collectFeedingData(formData);
        if (feedings.length > 0) {
            petData.feedings = feedings;
        }

        //ia datele medicale
        const medical = this.collectMedicalData(formData);
        if (medical.length > 0) {
            petData.medical = medical;
        }

        // mai trebuie modificat???????????????????????????????????
        const mediaFiles = document.getElementById('petMediaFiles').files;
        const mediaDescription = formData.get('mediaDescription') || '';
        
        try {
            // Trimite datele pet catre backend
            const response = await fetch('/PoW-Project/backend/public/api/mypets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(petData),
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                const petId = result.pet_id;
                
                // de verificat?????????????????????????
                if (mediaFiles && mediaFiles.length > 0) {
                    await this.uploadMediaForNewPet(petId, mediaFiles, mediaDescription);
                }
                
                this.showMessage('Pet added successfully with all data!', 'success');
                document.getElementById('addPetModal').style.display = 'none';
                
                // Reset form
                e.target.reset();
                this.resetFormEntries();
                
                // Reload pets list
                this.loadMyPets();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add pet');
            }
        } catch (error) {
            console.error('Error adding pet:', error);
            this.showMessage('Error adding pet: ' + error.message, 'error');
        }
    }
    collectFeedingData(formData) {
        const feedings = [];
        let index = 0;
          while (formData.has(`feedTime_${index}`)) {
            const feedTime = formData.get(`feedTime_${index}`);
            const foodType = formData.get(`foodType_${index}`);
            
            if (feedTime && foodType) {
                const today = new Date().toISOString().split('T')[0]; 
                const fullDateTime = `${today}T${feedTime}:00`; 
                
                feedings.push({
                    feed_time: fullDateTime,
                    food_type: foodType,
                    notes: formData.get(`feedNotes_${index}`) || ''
                });
            }
            index++;
        }
        
        return feedings;
    }
    collectMedicalData(formData) {
        const medical = [];
        let index = 0;
        
        while (formData.has(`medicalDate_${index}`)) {
            const eventDate = formData.get(`medicalDate_${index}`);
            const description = formData.get(`medicalDescription_${index}`);
            
            if (eventDate && description) {
                medical.push({
                    date_of_event: eventDate,
                    description: description,
                    treatment: formData.get(`medicalTreatment_${index}`) || '',
                    emergency: formData.has(`medicalEmergency_${index}`)
                });
            }
            index++;
        }
        
        return medical;
    }
    async uploadMediaForNewPet(petId, files, globalDescription) {
        const uploadPromises = Array.from(files).map(async (file) => {
            const fileFormData = new FormData();
            fileFormData.append('file', file);
            
            if (globalDescription) {
                fileFormData.append('description', globalDescription);
            }
            
            try {
                const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}/media`, {
                    method: 'POST',
                    body: fileFormData,
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }
                
                return { success: true, filename: file.name };
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                return { success: false, filename: file.name, error: error.message };
            }
        });
        
        try {
            const results = await Promise.all(uploadPromises);
            const failed = results.filter(r => !r.success);
            
            if (failed.length > 0) {
                this.showMessage(`Some media files failed to upload: ${failed.map(f => f.filename).join(', ')}`, 'warning');
            }
        } catch (error) {
            console.error('Error during media upload:', error);
            this.showMessage('Some media files failed to upload', 'warning');
        }
    }    resetFormEntries() {
        const feedingContainer = document.getElementById('feedingEntries');
        if (feedingContainer) {
            //pastreaza doar prima inregistrare de hranire si curata valorile
            const entries = feedingContainer.querySelectorAll('.feeding-entry');
            for (let i = 1; i < entries.length; i++) {
                entries[i].remove();
            }
            
            // curata valorile primei inregistrari
            const firstEntry = feedingContainer.querySelector('.feeding-entry[data-entry="0"]');
            if (firstEntry) {
                firstEntry.querySelectorAll('input, textarea').forEach(input => input.value = '');
            }
        }
        
        //restul inregistrarilor medicale 
        const medicalContainer = document.getElementById('medicalEntries');
        if (medicalContainer) {
            // pastreaza doar prima inregistrare medicala si curata valorile
            const entries = medicalContainer.querySelectorAll('.medical-entry');
            for (let i = 1; i < entries.length; i++) {
                entries[i].remove();
            }
            
            //curata valorile primei inregistrari
            const firstEntry = medicalContainer.querySelector('.medical-entry[data-entry="0"]');
            if (firstEntry) {
                firstEntry.querySelectorAll('input, textarea').forEach(input => {
                    if (input.type === 'checkbox') {
                        input.checked = false;
                    } else {
                        input.value = '';
                    }
                });
            }
        }
        
        // curata preview media
        const mediaPreview = document.getElementById('mediaPreview');
        if (mediaPreview) {
            mediaPreview.innerHTML = '';
        }
    }    setupFormEntryManagement() {
        const addFeedingBtn = document.getElementById('btnAddFeeding');
        if (addFeedingBtn) {
            addFeedingBtn.onclick = () => {
                this.addFeedingEntry();
            };
        }
        
        const addMedicalBtn = document.getElementById('btnAddMedical');
        if (addMedicalBtn) {
            addMedicalBtn.onclick = () => {
                this.addMedicalEntry();
            };
        }
        
        const mediaFiles = document.getElementById('petMediaFiles');
        if (mediaFiles) {
            mediaFiles.addEventListener('change', (e) => this.previewMediaFiles(e.target.files));
        }
    }    addFeedingEntry() {
        const container = document.getElementById('feedingEntries');
        if (!container) {
            return;
        }
        
        // cauta numarul maxim de inregistrari existente pentru a evita conflictele
        const existingEntries = container.querySelectorAll('.feeding-entry');
        let maxEntryNum = -1;
        existingEntries.forEach(entry => {
            const entryNum = parseInt(entry.dataset.entry);
            if (entryNum > maxEntryNum) {
                maxEntryNum = entryNum;
            }
        });
        
        const newEntryNum = maxEntryNum + 1;
        const newEntry = document.createElement('div');
        newEntry.className = 'feeding-entry';
        newEntry.dataset.entry = newEntryNum;
        
        newEntry.innerHTML = `
            <h4>Feeding Entry #${container.children.length + 1} 
                <button type="button" class="remove-feeding-entry" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </h4>            <div class="form-group">
                <label for="feedTime_${newEntryNum}">Time:</label>
                <input type="time" id="feedTime_${newEntryNum}" name="feedTime_${newEntryNum}">
            </div>
            <div class="form-group">
                <label for="foodType_${newEntryNum}">Food Type:</label>
                <input type="text" id="foodType_${newEntryNum}" name="foodType_${newEntryNum}" placeholder="e.g. Dry kibble, Wet food">
            </div>            <div class="form-group">
                <label for="feedNotes_${newEntryNum}">Notes (optional):</label>
                <textarea id="feedNotes_${newEntryNum}" name="feedNotes_${newEntryNum}" placeholder="Feeding observations..."></textarea>
            </div>
        `;        
        container.appendChild(newEntry);
    }
       addMedicalEntry() {
        const container = document.getElementById('medicalEntries');
        if (!container) {
            return;
        }
        
        // cauta numarul maxim de inregistrari existente pentru a evita conflictele
        const existingEntries = container.querySelectorAll('.medical-entry');
        let maxEntryNum = -1;
        existingEntries.forEach(entry => {
            const entryNum = parseInt(entry.dataset.entry);
            if (entryNum > maxEntryNum) {
                maxEntryNum = entryNum;
            }
        });
        
        const newEntryNum = maxEntryNum + 1;
        const newEntry = document.createElement('div');
        newEntry.className = 'medical-entry';
        newEntry.dataset.entry = newEntryNum;
        
        newEntry.innerHTML = `
            <h4>Medical Record #${container.children.length + 1} 
                <button type="button" class="remove-medical-entry" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </h4>
            <div class="form-group">
                <label for="medicalDate_${newEntryNum}">Event Date:</label>
                <input type="date" id="medicalDate_${newEntryNum}" name="medicalDate_${newEntryNum}">
            </div>
            <div class="form-group">
                <label for="medicalDescription_${newEntryNum}">Description:</label>
                <textarea id="medicalDescription_${newEntryNum}" name="medicalDescription_${newEntryNum}" placeholder="Describe the medical event..."></textarea>
            </div>
            <div class="form-group">
                <label for="medicalTreatment_${newEntryNum}">Treatment (optional):</label>
                <textarea id="medicalTreatment_${newEntryNum}" name="medicalTreatment_${newEntryNum}" placeholder="Treatment applied..."></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="medicalEmergency_${newEntryNum}" name="medicalEmergency_${newEntryNum}">
                    Emergency
                </label>
            </div>        `;        
        container.appendChild(newEntry);
    }
    previewMediaFiles(files) {
        const previewContainer = document.getElementById('mediaPreview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = '';
        
        if (!files || files.length === 0) return;
        
        const previewGrid = document.createElement('div');
        previewGrid.className = 'media-preview-grid';
        previewGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;';
        previewContainer.appendChild(previewGrid);
        
        Array.from(files).forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.style.cssText = 'border: 1px solid #ddd; padding: 10px; border-radius: 5px; text-align: center;';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                let mediaElement = '';
                if (file.type.startsWith('image/')) {
                    mediaElement = `<img src="${e.target.result}" alt="Preview ${index}" style="max-width: 100%; max-height: 120px; object-fit: cover;">`;
                } else if (file.type.startsWith('video/')) {
                    mediaElement = `<video src="${e.target.result}" style="max-width: 100%; max-height: 120px;" controls></video>`;
                }
                
                previewItem.innerHTML = `
                    ${mediaElement}
                    <div style="margin-top: 5px; font-size: 12px;">
                        <strong>${file.name}</strong><br>
                        <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
            previewGrid.appendChild(previewItem);
        });    }
    
    formatHealthStatus(healthStatus) {
        return this.renderer.formatHealthStatus(healthStatus);
    }
    
    showMessage(message, type = 'info') {
        this.domManager.showMessage(message, type);
    }
}

//initializeaza
let myPetsManager;
document.addEventListener('DOMContentLoaded', () => {
    myPetsManager = new MyPetsManager();
});