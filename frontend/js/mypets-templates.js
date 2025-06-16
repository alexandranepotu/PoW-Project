const MyPetsTemplates = {
    
    // Template pentru card-ul unui animal
    petCard: (pet, formatHealthStatus) => `
        <div class="pet-card" data-pet-id="${pet.animal_id}">
            <div class="pet-header">
                <h3>${pet.name}</h3>
                <div class="pet-actions">
                    <button onclick="myPetsManager.viewPetDetails(${pet.animal_id})" class="btn-view">Details</button>
                    <button onclick="myPetsManager.editPet(${pet.animal_id})" class="btn-edit">Edit</button>
                    <button onclick="myPetsManager.deletePet(${pet.animal_id})" class="btn-delete">Delete</button>
                </div>
            </div>
            <div class="pet-info">
                <p><strong>Specie:</strong> ${pet.species}</p>
                <p><strong>Breed:</strong> ${pet.breed || 'N/A'}</p>
                <p><strong>Age:</strong> ${pet.age || 'N/A'} years</p>
                <p><strong>Sex:</strong> ${pet.sex ? 'Female' : 'Male'}</p>
                <p><strong>Health Status:</strong> ${formatHealthStatus(pet.health_status)}</p>
                <p><strong>Available for adoption:</strong> ${pet.available ? 'Yes' : 'No'}</p>
            </div>
            <div class="pet-description">
                <p>${pet.description || 'No description'}</p>
            </div>
        </div>
    `,

    // Template pentru statistici->tb??
    statisticsGrid: (stats) => `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>All pets</h4>
                <span class="stat-number">${stats.total_pets || 0}</span>
            </div>
            <div class="stat-card">
                <h4>Recent feedings</h4>
                <span class="stat-number">${stats.recent_feedings || 0}</span>
                <small>Last week</small>
            </div>
            <div class="stat-card">
                <h4>Medical emergencies</h4>
                <span class="stat-number">${stats.emergency_records || 0}</span>
            </div>
        </div>
    `,

    // Template pentru detalii animal (modal)
    petDetailsModal: (pet, renderFeedingRecords, renderMedicalRecords, renderMediaGallery) => `
        <div class="pet-details">
            <div class="pet-basic-info">
                <h3>${pet.name}</h3>
                <div class="info-grid">
                    <p><strong>Specie:</strong> ${pet.species}</p>
                    <p><strong>Breed:</strong> ${pet.breed || 'N/A'}</p>
                    <p><strong>Age:</strong> ${pet.age || 'N/A'} years</p>
                    <p><strong>Sex:</strong> ${pet.sex ? 'Female' : 'Male'}</p>
                    <p><strong>Health status:</strong> ${pet.health_status}</p>
                    <p><strong>Pickup address:</strong> ${pet.pickup_address || 'N/A'}</p>
                </div>
                <div class="description">
                    <strong>Description:</strong>
                    <p>${pet.description || 'No description'}</p>
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" data-tab="feeding">Feeding calendar</button>
                <button class="tab-btn" data-tab="medical">Medical history</button>
                <button class="tab-btn" data-tab="media">Media</button>
            </div>
            
            <div class="tab-content">
                <div class="tab-pane active" id="feeding-tab">
                    <div class="section-header">
                        <h4>Feeding calendar</h4>
                        <button onclick="myPetsManager.showAddFeedingForm(${pet.animal_id})" class="btn-add-small">+ Add</button>
                    </div>
                    <div class="feeding-list">
                        ${renderFeedingRecords(pet.feeding_calendar || [])}
                    </div>
                </div>
                
                <div class="tab-pane" id="medical-tab">
                    <div class="section-header">
                        <h4>Medical history</h4>
                        <button onclick="myPetsManager.showAddMedicalForm(${pet.animal_id})" class="btn-add-small">+ Add</button>
                    </div>
                    <div class="medical-list">
                        ${renderMedicalRecords(pet.medical_history || [])}
                    </div>
                </div>
                
                <div class="tab-pane" id="media-tab">
                    <div class="section-header">
                        <h4>Media</h4>
                        <button onclick="myPetsManager.showUploadForm(${pet.animal_id})" class="btn-add-small">+ Upload</button>
                    </div>
                    <div class="media-gallery">
                        ${renderMediaGallery(pet.media || [])}
                    </div>
                </div>
            </div>
        </div>
    `,

    // Template pentru formularul de feeding
    feedingForm: () => `
        <form id="addFeedingForm">
            <div id="feedingEntries">
                <div class="feeding-entry" data-entry="0">
                    <h4>Feeding Entry #1</h4>
                    <div class="form-group">
                        <label for="feedTime_0">Time:</label>
                        <input type="time" id="feedTime_0" name="feed_time_0" required>
                    </div>
                    <div class="form-group">
                        <label for="foodType_0">Food type:</label>
                        <input type="text" id="foodType_0" name="food_type_0" required placeholder="e.g. Dry kibble, Wet food, Treats">
                    </div>
                    <div class="form-group">
                        <label for="notes_0">Notes (optional):</label>
                        <textarea id="notes_0" name="notes_0" placeholder="Feeding observations..."></textarea>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" id="addMoreFeeding">+ Add Another Feeding Entry</button>
                <button type="submit">Save All Feeding Records</button>
                <button type="button" onclick="document.getElementById('addFeedingModal').remove()">Cancel</button>
            </div>
        </form>
    `,

    // Template pentru formularul medical
    medicalForm: () => `
        <form id="addMedicalForm">
            <div id="medicalEntries">
                <div class="medical-entry" data-entry="0">
                    <h4>Medical Record #1</h4>
                    <div class="form-group">
                        <label for="eventDate_0">Event date:</label>
                        <input type="date" id="eventDate_0" name="date_of_event_0" required>
                    </div>
                    <div class="form-group">
                        <label for="description_0">Description:</label>
                        <textarea id="description_0" name="description_0" required placeholder="Describe the medical event..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="treatment_0">Treatment (optional):</label>
                        <textarea id="treatment_0" name="treatment_0" placeholder="Treatment applied..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="emergency_0" name="emergency_0">
                            Emergency
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" id="addMoreMedical">+ Add Another Medical Record</button>
                <button type="submit">Save All Medical Records</button>
                <button type="button" onclick="document.getElementById('addMedicalModal').remove()">Cancel</button>
            </div>
        </form>
    `,

    // Template pentru upload media
    uploadForm: () => `
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="mediaFiles">Select files (multiple):</label>
                <input type="file" id="mediaFiles" name="files" accept="image/*,video/*" multiple required>
                <small>You can select multiple images and videos at once</small>
            </div>
            <div class="form-group">
                <label for="globalDescription">Global description (optional):</label>
                <input type="text" id="globalDescription" name="global_description" placeholder="Description for all files...">
            </div>
            <div class="upload-previews" id="uploadPreviews"></div>
            <div class="form-actions">
                <button type="submit">Upload All Files</button>
                <button type="button" onclick="document.getElementById('uploadModal').remove()">Cancel</button>
            </div>
        </form>
    `,

    // Template pentru empty state
    emptyState: () => `
        <div class="empty-state">
            <h3>You have no pets</h3>
            <p>Add your first pet</p>
        </div>
    `,

    // Template pentru modal generic
    modal: (id, title) => `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body"></div>
        </div>
    `
};
