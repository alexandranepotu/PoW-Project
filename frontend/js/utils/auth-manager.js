class AuthManager {
    constructor() {
        this.apiClient = window.apiClient;
        if (!this.apiClient) {
            console.warn('ApiClient not available when AuthManager was initialized');
        }
    }
    checkAuth() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('userData');
        
        console.log('Checking auth - isLoggedIn:', isLoggedIn, 'userData:', userData);
        
        if (!isLoggedIn || isLoggedIn !== 'true' || !userData) {
            console.log('User not authenticated, redirecting to login...');
            this.redirectToLogin();
            return false;
        }
        
        console.log('User authenticated');
        return true;
    }  
    async checkAdminStatus() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            console.log('Checking admin status for user:', userData.username);
            
            if (!userData.is_admin) {
                console.log('User is not admin according to localStorage');
                return false;
            }

            if (!this.apiClient) {
                console.error('ApiClient not available for admin check');
                return false;
            }

            const response = await this.apiClient.get('/auth/check-admin');
            
            if (response.success && response.is_admin) {
                console.log('Server confirms admin status');
                return true;
            } else {
                console.log('Server denies admin status');
                return false;
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }    
    async logout() {
        try {
            console.log('Starting logout process...');
            
            if (this.apiClient) {
                const response = await this.apiClient.post('/auth/logout');
                
                if (response && response.success) {
                    console.log('Logout successful on server');
                } else {
                    console.warn('Server logout failed');
                }
            } else {
                console.warn('ApiClient not available for logout, proceeding with local logout');
            }
            
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            this.clearLocalStorage();
            this.redirectToLogin();
        }
    }
    clearLocalStorage() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        console.log('Local storage cleared');
    }

    redirectToLogin() {
        console.log('Redirecting to login page...');
        window.location.href = 'login.html';
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    getCurrentUserId() {
        const user = this.getCurrentUser();
        return user ? user.user_id : null;
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user ? !!user.is_admin : false;
    }
}

window.authManager = new AuthManager();
