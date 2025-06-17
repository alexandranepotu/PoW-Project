// pt rendering in MyPets
class MyPetsRenderer {
    
    constructor() {
        this.healthStatusMap = {
            'healthy': 'Healthy',
            'excellent': 'Excellent',
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor',
            'recovering': 'Recovering',
            'injured': 'Injured',
            'sick': 'Sick',
            'critical': 'Critical',
            'vaccinated': 'Vaccinated',
            'spayed_neutered': 'Spayed/Neutered',
            'pregnant': 'Pregnant',
            'elderly': 'Elderly',
            'special_needs': 'Special Needs',
            'under_treatment': 'Under Treatment',
            'quarantine': 'Quarantine',
            'unknown': 'Unknown'
        };
    }

    // rendereaza lista de animale
    renderPetsList(pets) {
        if (pets.length === 0) {
            return MyPetsTemplates.emptyState();
        }
        
        return pets.map(pet => 
            MyPetsTemplates.petCard(pet, this.formatHealthStatus.bind(this))
        ).join('');
    }

    // rendereaza statisticile
    renderStatistics(stats) {
        if (!stats || Object.keys(stats).length === 0) {
            return '';
        }
        return MyPetsTemplates.statisticsGrid(stats);
    }

    // rendereaza detaliile unui animal
    renderPetDetails(pet) {
        return MyPetsTemplates.petDetailsModal(
            pet,
            this.renderFeedingRecords.bind(this),
            this.renderMedicalRecords.bind(this),
            this.renderMediaGallery.bind(this)
        );
    }

    // rendereaza inregistrarile de hranire
    renderFeedingRecords(records) {
        if (!records || records.length === 0) {
            return '<p class="empty-message">No feeding record</p>';
        }
        
        return records.map(record => `
            <div class="record-item">
                <div class="record-info">
                    <strong>${new Date(record.feed_time).toLocaleString('ro-RO')}</strong>
                    <p>Food type: ${record.food_type}</p>
                    ${record.notes ? `<p>Note: ${record.notes}</p>` : ''}
                </div>
                <button onclick="myPetsManager.deleteFeedingRecord(${record.feed_id})" class="btn-delete-small">Delete</button>
            </div>
        `).join('');
    }

    // rendereaza inregistrarile medicale
    renderMedicalRecords(records) {
        if (!records || records.length === 0) {
            return '<p class="empty-message">No medical records</p>';
        }
        
        return records.map(record => `
            <div class="record-item ${record.emergency ? 'emergency' : ''}">
                <div class="record-info">
                    <strong>${new Date(record.date_of_event).toLocaleDateString('ro-RO')}</strong>
                    ${record.emergency ? '<span class="emergency-badge">EMERGENCY</span>' : ''}
                    <p>${record.description}</p>
                    ${record.treatment ? `<p><strong>Treatment:</strong> ${record.treatment}</p>` : ''}
                </div>
                <button onclick="myPetsManager.deleteMedicalRecord(${record.record_id})" class="btn-delete-small">🗑️</button>
            </div>
        `).join('');
    }

    // rendereaza galeria media
    renderMediaGallery(media) {
        if (!media || media.length === 0) {
            return '<p class="empty-message">No media</p>';
        }
          return media.map(item => `
            <div class="media-item">
                ${item.type === 'image' ? 
                    `<img src="http://localhost/${item.file_path}" alt="${item.description || 'Pet image'}" loading="lazy">` :
                    `<video src="http://localhost/${item.file_path}" controls preload="metadata"></video>`
                }
                <div class="media-controls">
                    <p class="media-description">${item.description || ''}</p>
                    <button onclick="myPetsManager.deleteMedia(${item.media_id})" class="btn-delete-small">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    // formateaza statusul de sanatate
    formatHealthStatus(healthStatus) {
        if (!healthStatus) {
            return '<span class="health-status-unknown">Unknown</span>';
        }
        
        // curata statusul pentru CSS class
        const cleanStatus = healthStatus.replace(/\s+/g, '_').toLowerCase();
        
        //gaseste numele de afisare
        const displayName = this.healthStatusMap[cleanStatus] || healthStatus;
        
        return `<span class="health-status-${cleanStatus}">${displayName}</span>`;
    }

    // rendereaza preview pentru media în formularul de adaugare
    renderMediaPreview(files) {
        if (!files || files.length === 0) return '';
        
        const previews = Array.from(files).map((file, index) => {
            let mediaElement = '';
            if (file.type.startsWith('image/')) {
                mediaElement = `<img alt="Preview ${index}" style="max-width: 100%; max-height: 120px; object-fit: cover;">`;
            } else if (file.type.startsWith('video/')) {
                mediaElement = `<video style="max-width: 100%; max-height: 120px;" controls></video>`;
            }
            
            return `
                <div class="preview-item" style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; text-align: center;">
                    ${mediaElement}
                    <div style="margin-top: 5px; font-size: 12px;">
                        <strong>${file.name}</strong><br>
                        <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="media-preview-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                ${previews}
            </div>
        `;
    }
}
