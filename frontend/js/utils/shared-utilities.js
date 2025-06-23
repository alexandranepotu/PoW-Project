class SharedUtilities {
    static escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    static formatDate(date, options = {}) {
        if (!date) return 'Unknown';
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        });
    }
    static formatDateTime(date) {
        if (!date) return 'Unknown';
        const dateObj = new Date(date);
        return dateObj.toLocaleString('ro-RO');
    }
    static createErrorMessage(message, showRetry = true) {
        return `
            <div class="error-message">
                <h3>Error</h3>
                <p>${this.escapeHtml(message)}</p>
                ${showRetry ? '<button onclick="location.reload()" class="retry-btn">Try Again</button>' : ''}
            </div>
        `;
    }
    static createEmptyMessage(message, actionText = null, actionHandler = null) {
        return `
            <div class="empty-state">
                <p>${this.escapeHtml(message)}</p>
                ${actionText && actionHandler ? `<button onclick="${actionHandler}" class="btn-primary">${actionText}</button>` : ''}
            </div>
        `;
    }
    static getFallbackImageSvg() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    static setupImageFallback(imgElement) {
        if (!imgElement) return;
        imgElement.onerror = function() {
            this.onerror = null;
            this.src = SharedUtilities.getFallbackImageSvg();
        };
    }
    static validatePetData(data) {
        const required = ['name', 'species'];
        const missing = required.filter(field => !data[field]);
        return {
            isValid: missing.length === 0,
            missingFields: missing
        };
    }
    static formatHealthStatus(status) {
        if (!status) return 'Unknown';
        const statusMap = {
            'healthy': 'Healthy',
            'good': 'Good',
            'poor': 'Poor', 
            'injured': 'Injured',
            'sick': 'Sick',
            'critical': 'Critical',
            'special_needs': 'Special Needs',
            'under_treatment': 'Under Treatment'
        };
        return statusMap[status.toLowerCase()] || status;
    }   
    static showMessage(message, type = 'info', container = null) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        const targetContainer = container || document.querySelector('.message-container') || document.body;
        targetContainer.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
    static confirm(message) {
        return window.confirm(message);
    }
    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }
    static combineDateAndTime(date, time) {
        return `${date}T${time}:00`;
    }
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

window.SharedUtilities = SharedUtilities;
