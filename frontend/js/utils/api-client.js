class ApiClient {
    constructor() {
        this.baseUrl = '/PoW-Project/backend/public/api';
        this.defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const responseText = await response.text();
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.handleUnauthorized();
                    throw new Error('Authentication required');
                }
                throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
            }

            if (responseText.trim()) {
                try {
                    return JSON.parse(responseText);
                } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    console.error('Response text:', responseText);
                    throw new Error('Invalid JSON response from server');
                }
            }
            
            return null;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    handleUnauthorized() {
        console.log('Unauthorized request, redirecting to login...');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data = null, options = {}) {
        const config = { ...options, method: 'POST' };
        if (data) {
            config.body = JSON.stringify(data);
        }
        return this.request(endpoint, config);
    }

    async put(endpoint, data = null, options = {}) {
        const config = { ...options, method: 'PUT' };
        if (data) {
            config.body = JSON.stringify(data);
        }
        return this.request(endpoint, config);
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    async uploadFile(endpoint, formData, options = {}) {
        const config = {
            ...options,
            method: 'POST',
            credentials: 'include',
            body: formData
        };
        delete config.headers;
        
        return this.request(endpoint, config);
    }
}

window.apiClient = new ApiClient();
