class MyPetsDOMManager {
    
    constructor() {
        this.containers = {
            pets: null,
            stats: null,
            messages: null
        };
    }

    // creeaza/gaseste containerul pentru animale
    getPetsContainer() {
        if (!this.containers.pets) {
            this.containers.pets = document.getElementById('petsContainer') || this.createPetsContainer();
        }
        return this.containers.pets;
    }

    createPetsContainer() {
        const container = document.createElement('div');
        container.id = 'petsContainer';
        container.className = 'pets-container';
        
        const main = document.querySelector('main') || document.body;
        main.appendChild(container);
        
        return container;
    }

    // creeaza/gaseste containerul pentru statistici
    getStatsContainer() {
        if (!this.containers.stats) {
            this.containers.stats = document.getElementById('statsContainer') || this.createStatsContainer();
        }
        return this.containers.stats;
    }

    createStatsContainer() {
        const container = document.createElement('div');
        container.id = 'statsContainer';
        container.className = 'stats-container';
        
        const main = document.querySelector('main') || document.body;
        main.insertBefore(container, main.firstChild);
        
        return container;
    }

    // creeaza modal generic
    createModal(id, title) {
        // sterge modalul existent daca exista
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = MyPetsTemplates.modal(id, title);
        
        document.body.appendChild(modal);
        
        // adaug event listeners pentru tab switching
        this.setupModalEvents(modal);
        
        modal.style.display = 'flex';
        return modal;
    }

    setupModalEvents(modal) {
        // Close pe buton
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close pe click in afara modal-ului
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Setup pentru tab switching
    setupTabSwitching(modal) {
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabPanes = modal.querySelectorAll('.tab-pane');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.dataset.tab + '-tab';
                const targetPane = modal.querySelector('#' + tabId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    // Gestionarea mesajelor
    showMessage(message, type = 'info') {
        if (!this.containers.messages) {
            this.containers.messages = document.getElementById('messageContainer') || this.createMessageContainer();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        this.containers.messages.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        document.body.appendChild(container);
        return container;
    }

    // Creeaza preview pentru fisiere media
    createMediaPreview(files, container) {
        if (!files || files.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = '<h4>Preview Files:</h4><div class="preview-grid"></div>';
        const previewGrid = container.querySelector('.preview-grid');
        
        Array.from(files).forEach((file, index) => {
            const previewItem = this.createPreviewItem(file, index);
            previewGrid.appendChild(previewItem);
        });
    }

    createPreviewItem(file, index) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.style.cssText = 'display: inline-block; margin: 10px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            let mediaElement = '';
            if (file.type.startsWith('image/')) {
                mediaElement = `<img src="${e.target.result}" alt="Preview ${index}" style="max-width: 150px; max-height: 150px; display: block;">`;
            } else if (file.type.startsWith('video/')) {
                mediaElement = `<video src="${e.target.result}" controls style="max-width: 150px; max-height: 150px; display: block;"></video>`;
            }
            
            previewItem.innerHTML = `
                ${mediaElement}
                <div style="margin-top: 5px;">
                    <strong>${file.name}</strong><br>
                    <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small><br>
                    <input type="text" placeholder="Individual description..." name="description_${index}" style="width: 100%; margin-top: 5px; padding: 2px;">
                </div>
            `;
        };
        reader.readAsDataURL(file);
        
        return previewItem;
    }

    //  entry nou pentru feeding
    addFeedingEntry(container, entryCount) {
        const newEntry = document.createElement('div');
        newEntry.className = 'feeding-entry';
        newEntry.dataset.entry = entryCount;
        
        newEntry.innerHTML = `
            <h4>Feeding Entry #${container.children.length + 1} 
                <button type="button" class="remove-entry" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </h4>
            <div class="form-group">
                <label for="feedTime_${entryCount}">Time:</label>
                <input type="time" id="feedTime_${entryCount}" name="feed_time_${entryCount}" required>
            </div>
            <div class="form-group">
                <label for="foodType_${entryCount}">Food type:</label>
                <input type="text" id="foodType_${entryCount}" name="food_type_${entryCount}" required placeholder="e.g. Dry kibble, Wet food, Treats">
            </div>
            <div class="form-group">
                <label for="notes_${entryCount}">Notes (optional):</label>
                <textarea id="notes_${entryCount}" name="notes_${entryCount}" placeholder="Feeding observations..."></textarea>
            </div>
        `;
        
        container.appendChild(newEntry);
        return newEntry;
    }

    // entry nou pentru medical
    addMedicalEntry(container, entryCount) {
        const newEntry = document.createElement('div');
        newEntry.className = 'medical-entry';
        newEntry.dataset.entry = entryCount;
        
        newEntry.innerHTML = `
            <h4>Medical Record #${container.children.length + 1} 
                <button type="button" class="remove-entry" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </h4>
            <div class="form-group">
                <label for="eventDate_${entryCount}">Event date:</label>
                <input type="date" id="eventDate_${entryCount}" name="date_of_event_${entryCount}" required>
            </div>
            <div class="form-group">
                <label for="description_${entryCount}">Description:</label>
                <textarea id="description_${entryCount}" name="description_${entryCount}" required placeholder="Describe the medical event..."></textarea>
            </div>
            <div class="form-group">
                <label for="treatment_${entryCount}">Treatment (optional):</label>
                <textarea id="treatment_${entryCount}" name="treatment_${entryCount}" placeholder="Treatment applied..."></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="emergency_${entryCount}" name="emergency_${entryCount}">
                    Emergency
                </label>
            </div>
        `;
        
        container.appendChild(newEntry);
        return newEntry;
    }
}
