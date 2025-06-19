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

    // rendereaza inregistrarile de hranire
    renderFeedingRecords(records) {
        if (!records || records.length === 0) {
            return '<p class="empty-message">No feeding record</p>';
        }
        
        return records.map(record => `
            <div class="record-item">
                <div class="record-info">
                    <strong>${new Date(record.feed_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</strong>
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
    }    // rendereaza galeria media
    renderMediaGallery(media) {
        if (!media || media.length === 0) {
            return '<p class="empty-message">No media</p>';
        }        return media.map(item => `
            <div class="media-item">
                ${item.type === 'image' || (item.file_type && item.file_type.startsWith('image/')) ? 
                    `<img src="http://localhost${item.file_path}" alt="${item.description || 'Pet image'}" loading="lazy">` :
                    `<video src="http://localhost${item.file_path}" muted preload="metadata" controls="false"></video>`
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
}
