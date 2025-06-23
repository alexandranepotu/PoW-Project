class MyPetsManager {
    constructor() {
        this.currentPetId = null;
        this.pets = [];
        this.domManager = new MyPetsDOMManager();
        this.renderer = new MyPetsRenderer();
        this.feedingManager = null;
        this.medicalManager = null;
        this.init();
    }

    async init() {
        await this.loadMyPets();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const addBtn = document.querySelector('.btn-add');
        const modal = document.getElementById('addPetModal');
        const closeBtn = modal?.querySelector('.close-btn');
        const form = document.getElementById('addPetForm');
        
        if (modal) {
            modal.style.display = 'none';
        }

        if (addBtn && modal) {
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
    }

    async loadMyPets() {        try {
            const data = await apiClient.get('/mypets');
            this.pets = data.pets || [];
            this.renderPetsList(this.pets);
        } catch (error) {
            if (error.message.includes('Authentication required')) {
                SharedUtilities.showMessage('You must authenticate', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                SharedUtilities.showMessage('Error loading pets: ' + error.message, 'error');
            }
        }
    }renderPetsList(pets) {
        const container = this.domManager.getPetsContainer();
        container.innerHTML = this.renderer.renderPetsList(pets);
    }
    
    createPetsContainer() {
        return this.domManager.createPetsContainer();
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
        
        const feedingContainer = modal.querySelector('#feedingEntries');
        this.feedingManager = FormEntryFactory.createFeedingManager(feedingContainer);
        
        modal.querySelector('#addMoreFeeding').addEventListener('click', () => {
            this.feedingManager.addEntry();
        });
          
        modal.querySelector('#addFeedingForm').addEventListener('submit', (e) => {
            this.handleMultipleFeeding(e, petId);
        });
    }    async handleMultipleFeeding(e, petId) {
        e.preventDefault();
        
        if (!this.feedingManager) return;
          const validation = this.feedingManager.validateEntries();
        if (!validation.isValid) {
            SharedUtilities.showMessage('Please fill in all required fields: ' + validation.errors.join(', '), 'error');
            return;
        }

        const feedingData = this.feedingManager.getAllEntryData();
        const today = SharedUtilities.getCurrentDate();
        
        try {
            const processedRecords = feedingData.map(data => ({
                feed_time: SharedUtilities.combineDateAndTime(today, data.feed_time_0 || data.feed_time),
                food_type: data.food_type_0 || data.food_type,
                notes: data.notes_0 || data.notes || ''
            }));            for (const record of processedRecords) {
                await apiClient.post(`/mypets/${petId}/feeding`, record);
            }
            
            SharedUtilities.showMessage(`${processedRecords.length} feeding records added successfully!`, 'success');
            document.getElementById('addFeedingModal').remove();
            this.editPet(petId);
            
        } catch (error) {
            SharedUtilities.showMessage('Error adding feeding records', 'error');
        }
    }showAddMedicalForm(petId) {
        const modal = this.createModal('addMedicalModal', 'Add Medical Records - Multiple Entries');
        modal.querySelector('.modal-body').innerHTML = MyPetsTemplates.medicalForm();
        
        const medicalContainer = modal.querySelector('#medicalEntries');
        this.medicalManager = FormEntryFactory.createMedicalManager(medicalContainer);
        
        modal.querySelector('#addMoreMedical').addEventListener('click', () => {
            this.medicalManager.addEntry();
        });
          modal.querySelector('#addMedicalForm').addEventListener('submit', (e) => {
            this.handleMultipleMedical(e, petId);
        });
    }

    async handleMultipleMedical(e, petId) {
        e.preventDefault();
        
        if (!this.medicalManager) return;
          const validation = this.medicalManager.validateEntries();
        if (!validation.isValid) {
            SharedUtilities.showMessage('Please fill in all required fields: ' + validation.errors.join(', '), 'error');
            return;
        }

        const medicalData = this.medicalManager.getAllEntryData();
        
        try {
            const processedRecords = medicalData.map(data => ({
                date_of_event: data.date_of_event_0 || data.date_of_event,
                description: data.description_0 || data.description,
                treatment: data.treatment_0 || data.treatment || '',
                emergency: data.emergency_0 || data.emergency || false
            }));

            for (const record of processedRecords) {
                await apiClient.post(`/mypets/${petId}/medical`, record);
            }
              SharedUtilities.showMessage(`${processedRecords.length} medical records added successfully!`, 'success');
            document.getElementById('addMedicalModal').remove();
            this.editPet(petId);
        } catch (error) {
            SharedUtilities.showMessage('Error adding medical records', 'error');
        }
    }showUploadForm(petId) {
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
            this.editPet(petId);
            
        } catch (error) {
            console.error('Error during multiple upload:', error);
            this.showMessage('Error uploading files', 'error');
        }
    }      async deleteFeedingRecord(feedId) {
        if (!SharedUtilities.confirm('Are you sure you want to delete this feeding record?')) return;
        
        try {
            await apiClient.delete(`/mypets/feeding/${feedId}`);
            SharedUtilities.showMessage('Record deleted successfully!', 'success');
            this.editPet(this.currentPetId);
        } catch (error) {
            console.error('Error deleting feeding record:', error);
            SharedUtilities.showMessage('Error deleting feeding record', 'error');
        }
    }

    async deleteMedicalRecord(recordId) {
        if (!SharedUtilities.confirm('Are you sure you want to delete this medical record?')) return;
        
        try {
            await apiClient.delete(`/mypets/medical/${recordId}`);
            SharedUtilities.showMessage('Medical record deleted successfully!', 'success');
            this.editPet(this.currentPetId);
        } catch (error) {
            console.error('Error deleting medical record:', error);
            SharedUtilities.showMessage('Error deleting medical record', 'error');
        }
    }

    async deleteMedia(mediaId) {
        if (!SharedUtilities.confirm('Are you sure you want to delete this media file?')) return;
        
        try {            await apiClient.delete(`/mypets/media/${mediaId}`);
            SharedUtilities.showMessage('Media file deleted successfully!', 'success');
            this.editPet(this.currentPetId);
        } catch (error) {
            console.error('Error deleting media:', error);
            SharedUtilities.showMessage('Error deleting media', 'error');
        }
    }async editPet(petId) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load pet data');
            }
            
            const data = await response.json();
            const pet = data.pet;
            
            // Creează modal-ul de editare
            const modal = this.createModal('editPetModal', `Edit ${pet.name}`);
            modal.querySelector('.modal-body').innerHTML = MyPetsTemplates.editPetForm(pet);
            
            // Setup event listeners pentru form
            const form = modal.querySelector('#editPetForm');
            form.addEventListener('submit', (e) => this.handleEditPet(e, petId));
            
            // Setup pentru butoanele de editare records
            const editFeedingBtn = modal.querySelector('#editFeedingBtn');
            if (editFeedingBtn) {
                editFeedingBtn.addEventListener('click', () => this.showAddFeedingForm(petId));
            }
            
            const editMedicalBtn = modal.querySelector('#editMedicalBtn');
            if (editMedicalBtn) {
                editMedicalBtn.addEventListener('click', () => this.showAddMedicalForm(petId));
            }
              const editMediaBtn = modal.querySelector('#editMediaBtn');
            if (editMediaBtn) {
                editMediaBtn.addEventListener('click', () => this.showUploadForm(petId));
            }
            
        } catch (error) {
            console.error('Error loading pet for editing:', error);
            this.showMessage('Error loading pet data for editing', 'error');
        }
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
                
                if (mediaFiles && mediaFiles.length > 0) {
                    await this.uploadMediaForNewPet(petId, mediaFiles, mediaDescription);
                }

                if (!result.hasRealAddress) {
                    const goToProfile = confirm(
                        'Pet added successfully! However, you are using a default address. Would you like to go to your Profile page to add your real address for better accuracy?'
                    );
                    
                    if (goToProfile) {
                        window.location.href = 'profile.html';
                        return;
                    }
                    
                    this.showMessage('Pet added successfully! Please consider adding your real address in Profile page.', 'warning');
                } else {
                    this.showMessage('Pet added successfully with all data!', 'success');
                }
                
                document.getElementById('addPetModal').style.display = 'none';
                
                e.target.reset();
                this.resetFormEntries();
                
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
        
        if (mediaPreview) {
            mediaPreview.innerHTML = '';
        }
    }

    setupFormEntryManagement() {
        const mediaFiles = document.getElementById('petMediaFiles');
        if (mediaFiles) {
            mediaFiles.addEventListener('change', (e) => {
                const previewContainer = document.getElementById('mediaPreview');
                if (previewContainer) {
                    this.domManager.createMediaPreview(e.target.files, previewContainer);
                }
            });
        }
    }

    async handleEditPet(e, petId) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        //ia datele din formular
        const petData = {
            name: formData.get('name'),
            species: formData.get('species'),
            breed: formData.get('breed') || '',
            age: parseInt(formData.get('age')) || null,
            sex: formData.get('sex') || null,
            health_status: formData.get('health_status') || '',
            description: formData.get('description') || ''
        };
        
        //validare date obligatorii
        if (!petData.name || !petData.species) {
            this.showMessage('Please fill in the required fields (Name and Species)', 'error');
            return;
        }

        try {
            const response = await fetch(`/PoW-Project/backend/public/api/mypets/${petId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(petData)
            });
            
            if (response.ok) {
                this.showMessage('Pet updated successfully!', 'success');
                document.getElementById('editPetModal').remove();
                this.loadMyPets(); // Reîncarcă lista de animale
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update pet');
            }
        } catch (error) {
            console.error('Error updating pet:', error);
            this.showMessage('Error updating pet: ' + error.message, 'error');
        }
    }
    
    formatHealthStatus(healthStatus) {
        return this.renderer.formatHealthStatus(healthStatus);
    }
    
    showMessage(message, type = 'info') {        this.domManager.showMessage(message, type);    }
}

// Initializeaza
let myPetsManager;
document.addEventListener('DOMContentLoaded', () => {
    myPetsManager = new MyPetsManager();
});