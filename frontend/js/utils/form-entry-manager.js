class FormEntryManager {
    constructor(container, entryType, template) {
        this.container = container;
        this.entryType = entryType;
        this.template = template;
        this.entryCount = 0;
    }
    addEntry(data = {}) {
        if (!this.container) return null;

        const existingEntries = this.container.querySelectorAll(`.${this.entryType}-entry`);
        let maxEntryNum = -1;
        existingEntries.forEach(entry => {
            const entryNum = parseInt(entry.dataset.entry);
            if (entryNum > maxEntryNum) {
                maxEntryNum = entryNum;
            }
        });

        const newEntryNum = maxEntryNum + 1;
        const newEntry = document.createElement('div');
        newEntry.className = `${this.entryType}-entry`;
        newEntry.dataset.entry = newEntryNum;
        
        newEntry.innerHTML = this.template(newEntryNum, this.container.children.length + 1, data);
        
        this.container.appendChild(newEntry);
        this.entryCount++;

        this.setupRemoveButton(newEntry);
        
        return newEntry;
    }
    removeEntry(entry) {
        if (entry && entry.parentNode === this.container) {
            entry.remove();
            this.entryCount--;
            this.updateEntryNumbers();
        }
    }
    setupRemoveButton(entry) {
        const removeBtn = entry.querySelector('.remove-entry, .remove-feeding-entry, .remove-medical-entry');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeEntry(entry);
            });
        }
    }
    updateEntryNumbers() {
        const entries = this.container.querySelectorAll(`.${this.entryType}-entry`);
        entries.forEach((entry, index) => {
            const header = entry.querySelector('h4');
            if (header) {
                const entryName = this.entryType.charAt(0).toUpperCase() + this.entryType.slice(1);
                header.textContent = header.textContent.replace(/^.*#\d+/, `${entryName} Entry #${index + 1}`);
            }
        });
    }
    resetEntries() {
        const entries = this.container.querySelectorAll(`.${this.entryType}-entry`);
        
        for (let i = 1; i < entries.length; i++) {
            entries[i].remove();
        }
        const firstEntry = entries[0];
        if (firstEntry) {
            firstEntry.querySelectorAll('input, textarea, select').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }

        this.entryCount = firstEntry ? 1 : 0;
    }
    getAllEntryData() {
        const entries = this.container.querySelectorAll(`.${this.entryType}-entry`);
        const data = [];

        entries.forEach(entry => {
            const entryData = {};
            const inputs = entry.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        entryData[input.name] = input.checked;
                    } else {
                        entryData[input.name] = input.value;
                    }
                }
            });

            const hasData = Object.values(entryData).some(value => 
                value !== '' && value !== false
            );
            if (hasData) {
                data.push(entryData);
            }
        });

        return data;
    }
    getEntryCount() {
        return this.container.querySelectorAll(`.${this.entryType}-entry`).length;
    }
    validateEntries() {
        const entries = this.container.querySelectorAll(`.${this.entryType}-entry`);
        const errors = [];

        entries.forEach((entry, index) => {
            const requiredInputs = entry.querySelectorAll('input[required], textarea[required], select[required]');
            
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    errors.push(`Entry ${index + 1}: ${input.previousElementSibling?.textContent || input.name} is required`);
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

class FormEntryFactory {

    static createFeedingManager(container) {
        const template = (entryNum, displayNum) => `
            <h4>Feeding Entry #${displayNum} 
                <button type="button" class="remove-entry">Remove</button>
            </h4>
            <div class="form-group">
                <label for="feedTime_${entryNum}">Time:</label>
                <input type="time" id="feedTime_${entryNum}" name="feed_time_${entryNum}" required>
            </div>
            <div class="form-group">
                <label for="foodType_${entryNum}">Food Type:</label>
                <input type="text" id="foodType_${entryNum}" name="food_type_${entryNum}" required placeholder="e.g. Dry kibble, Wet food">
            </div>
            <div class="form-group">
                <label for="notes_${entryNum}">Notes (optional):</label>
                <textarea id="notes_${entryNum}" name="notes_${entryNum}" placeholder="Feeding observations..."></textarea>
            </div>
        `;

        return new FormEntryManager(container, 'feeding', template);
    }

    static createMedicalManager(container) {
        const template = (entryNum, displayNum) => `
            <h4>Medical Record #${displayNum} 
                <button type="button" class="remove-entry">Remove</button>
            </h4>
            <div class="form-group">
                <label for="eventDate_${entryNum}">Event Date:</label>
                <input type="date" id="eventDate_${entryNum}" name="date_of_event_${entryNum}" required>
            </div>
            <div class="form-group">
                <label for="description_${entryNum}">Description:</label>
                <textarea id="description_${entryNum}" name="description_${entryNum}" required placeholder="Describe the medical event..."></textarea>
            </div>
            <div class="form-group">
                <label for="treatment_${entryNum}">Treatment (optional):</label>
                <textarea id="treatment_${entryNum}" name="treatment_${entryNum}" placeholder="Treatment applied..."></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="emergency_${entryNum}" name="emergency_${entryNum}">
                    Emergency
                </label>
            </div>
        `;

        return new FormEntryManager(container, 'medical', template);
    }
}

window.FormEntryManager = FormEntryManager;
window.FormEntryFactory = FormEntryFactory;
