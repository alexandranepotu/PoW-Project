const MyPetsTemplates = {
    
    // Template pentru card-ul unui animal
    petCard: (pet, formatHealthStatus) => `
        <div class="pet-card" data-pet-id="${pet.animal_id}">
            <div class="pet-header">
                <h3>${pet.name}</h3>                <div class="pet-actions">
                    <button onclick="myPetsManager.editPet(${pet.animal_id})" class="btn-edit">View & Edit</button>
                    <button onclick="myPetsManager.deletePet(${pet.animal_id})" class="btn-delete">Delete</button>
                </div>
            </div>            <div class="pet-info">
                <p><strong>Specie:</strong> ${pet.species}</p>
                <p><strong>Breed:</strong> ${pet.breed || 'N/A'}</p>
                <p><strong>Age:</strong> ${pet.age || 'N/A'} years</p>
                <p><strong>Sex:</strong> ${pet.sex === 'female' ? 'Female' : pet.sex === 'male' ? 'Male' : 'Unknown'}</p>
                <p><strong>Health Status:</strong> ${formatHealthStatus(pet.health_status)}</p>
                <p><strong>Available for adoption:</strong> ${pet.available ? 'Yes' : 'No'}</p>
            </div>
            <div class="pet-description">                <p>${pet.description || 'No description'}</p>
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
    `,    // Template pentru modal generic
    modal: (id, title) => `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body"></div>
        </div>
    `,    // Template pentru editarea unui animal
    editPetForm: (pet) => {
        return `
        <form id="editPetForm" class="edit-pet-form">
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-group">
                    <label for="edit_name">Name:</label>                    <input type="text" id="edit_name" name="name" value="${pet.name || ''}" required>
                </div>
                  <div class="form-group">
                    <label for="edit_species">Species:</label>
                    <select id="edit_species" name="species" required>
                        <option value="dog" ${(pet.species || '').toLowerCase() === 'dog' ? 'selected' : ''}>Dog</option>
                        <option value="cat" ${(pet.species || '').toLowerCase() === 'cat' ? 'selected' : ''}>Cat</option>
                        <option value="bird" ${(pet.species || '').toLowerCase() === 'bird' ? 'selected' : ''}>Bird</option>
                        <option value="rabbit" ${(pet.species || '').toLowerCase() === 'rabbit' ? 'selected' : ''}>Rabbit</option>
                        <option value="other" ${(pet.species || '').toLowerCase() === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit_breed">Breed:</label>
                    <input type="text" id="edit_breed" name="breed" value="${pet.breed || ''}">
                </div>
                
                <div class="form-group">
                    <label for="edit_age">Age (years):</label>
                    <input type="number" id="edit_age" name="age" value="${pet.age || ''}" min="0" max="30">
                </div>
                  <div class="form-group">
                    <label for="edit_sex">Sex:</label>
                    <select id="edit_sex" name="sex">
                        <option value="">Unknown</option>
                        <option value="male" ${(pet.sex === 'male' || pet.sex === '0' || pet.sex === 0) ? 'selected' : ''}>Male</option>
                        <option value="female" ${(pet.sex === 'female' || pet.sex === '1' || pet.sex === 1) ? 'selected' : ''}>Female</option>
                    </select>
                </div>
                  <div class="form-group">
                    <label for="edit_health_status">Health Status:</label>
                    <select id="edit_health_status" name="health_status">
                        <option value="">Select status</option>
                        <option value="healthy" ${(pet.health_status || '') === 'healthy' ? 'selected' : ''}>Healthy</option>
                        <option value="good" ${(pet.health_status || '') === 'good' ? 'selected' : ''}>Good</option>
                        <option value="poor" ${(pet.health_status || '') === 'poor' ? 'selected' : ''}>Poor</option>
                        <option value="injured" ${(pet.health_status || '') === 'injured' ? 'selected' : ''}>Injured</option>
                        <option value="sick" ${(pet.health_status || '') === 'sick' ? 'selected' : ''}>Sick</option>
                        <option value="critical" ${(pet.health_status || '') === 'critical' ? 'selected' : ''}>Critical</option>
                        <option value="special_needs" ${(pet.health_status || '') === 'special_needs' ? 'selected' : ''}>Special Needs</option>
                        <option value="under_treatment" ${(pet.health_status || '') === 'under_treatment' ? 'selected' : ''}>Under Treatment</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit_description">Description:</label>
                    <textarea id="edit_description" name="description" rows="4">${pet.description || ''}</textarea>
                </div>
            </div>
            
            <div class="form-section">
                <h3>Current Records</h3>
                  <div class="current-feeding-records">
                    <h4>Feeding Records <button type="button" id="editFeedingBtn" class="btn-secondary">Edit Feeding Records</button></h4>
                    <div id="currentFeedingList">
                        ${pet.feeding_calendar && pet.feeding_calendar.length > 0 ? 
                            pet.feeding_calendar.slice(0, 3).map(record => `
                                <div class="record-item">
                                    <span>${new Date(record.feed_time).toLocaleString()} - ${record.food_type}</span>
                                    <button type="button" onclick="myPetsManager.deleteFeedingRecord(${record.feed_id})" class="btn-delete-small">Delete</button>
                                </div>
                            `).join('') : 
                            '<p>No feeding records</p>'
                        }
                    </div>
                </div>
                
                <div class="current-medical-records">
                    <h4>Medical Records <button type="button" id="editMedicalBtn" class="btn-secondary">Edit Medical Records</button></h4>
                    <div id="currentMedicalList">
                        ${pet.medical_history && pet.medical_history.length > 0 ? 
                            pet.medical_history.slice(0, 3).map(record => `
                                <div class="record-item ${record.emergency ? 'emergency' : ''}">
                                    <span>${new Date(record.date_of_event).toLocaleDateString()} - ${record.description}</span>
                                    <button type="button" onclick="myPetsManager.deleteMedicalRecord(${record.record_id})" class="btn-delete-small">Delete</button>
                                </div>
                            `).join('') : 
                            '<p>No medical records</p>'
                        }
                    </div>
                </div>                <div class="current-media">
                    <h4>Media Files <button type="button" id="editMediaBtn" class="btn-secondary">Manage Media</button></h4>
                    <div id="currentMediaList" class="media-gallery">                        ${pet.media && pet.media.length > 0 ? 
                            pet.media.slice(0, 6).map(media => `
                                <div class="media-item edit-mode">
                                    ${media.type === 'image' || (media.file_type && media.file_type.startsWith('image/')) ? 
                                        `<img src="http://localhost${media.file_path}" alt="Pet media" class="media-preview" loading="lazy">` :
                                        `<video class="media-preview" muted preload="metadata"><source src="http://localhost${media.file_path}"></video>`
                                    }
                                    <button type="button" onclick="myPetsManager.deleteMedia(${media.media_id})" class="btn-delete-small">Delete</button>
                                </div>
                            `).join('') + 
                            (pet.media.length > 6 ? `<div class="media-item-more"><span>+${pet.media.length - 6} more...</span></div>` : '') : 
                            '<p>No media files</p>'
                        }</div>
                </div>
            </div>
              <div class="form-section">
                <h3>Pickup Location</h3>
                <div class="pickup-address-section">                    <h4>Current Pickup Address:</h4>
                    <p class="current-address">${pet.pickup_address || 'Address will be set automatically'}</p>
                    <div class="address-buttons">
                        <button type="button" id="updateAddressBtn" class="btn-secondary" onclick="myPetsManager.updatePickupAddress(${pet.animal_id})">>
                            Update to My Address
                        </button>
                    </div>
                    <small class="address-note">Address is automatically set from your profile or default location</small>
                </div>
            </div>            
            <div class="form-actions">
                <button type="submit" class="btn-primary">Save Changes</button>
                <button type="button" onclick="document.getElementById('editPetModal').remove()" class="btn-secondary">Cancel</button>
            </div>
        </form>
        `;
    }
};
