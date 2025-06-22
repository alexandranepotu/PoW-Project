class AuthManager {
    constructor() {
        this.apiUrl = '/PoW-Project/backend/public/api'; 
        this.init();
    }

    init() {
        //verifica daca userul este autentificat la incarcarea paginii
        this.checkAuth();
        this.checkAdminStatus();
    }    checkAuth() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('userData');
        
        console.log('Checking auth - isLoggedIn:', isLoggedIn, 'userData:', userData);
        
        //daca nu este autentificat, redirectioneaza la pagina de login
        if (!isLoggedIn || isLoggedIn !== 'true' || !userData) {
            console.log('User not authenticated, redirecting to login...');
            this.redirectToLogin();
            return false;
        }
        
        console.log('User authenticated');
        return true;
    }    async checkAdminStatus() {
        try {
            const adminLink = document.getElementById('adminLink');
            if (!adminLink) return;

            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            console.log('Dashboard - Checking admin status for user:', userData.username);
            console.log('Dashboard - User is_admin value:', userData.is_admin);
              if (!userData.is_admin) {
                console.log('Dashboard - User is not admin, hiding admin link');
                adminLink.style.display = 'none';
                adminLink.style.visibility = 'hidden';
                adminLink.remove(); 
                return;
            }
            const response = await fetch(`${this.apiUrl}/auth/check-admin`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard - Server admin check response:', data);
                if (data.success && data.is_admin) {
                    console.log('Dashboard - Server confirms admin status, showing admin link');
                    adminLink.style.display = 'block';
                } else {
                    console.log('Dashboard - Server denies admin status, hiding admin link');
                    adminLink.style.display = 'none';
                }
            } else {
                console.log('Dashboard - Server check failed, hiding admin link');
                adminLink.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            const adminLink = document.getElementById('adminLink');
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    }

    async logout() {
        try {
            console.log('Starting logout process...');
            
            //apeleaza API-ul de logout
            const response = await fetch(`${this.apiUrl}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // Include cookies pentru sesiune
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('Logout successful on server');
            } else {
                console.warn('Server logout failed:', result.error);
            }
            
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            this.clearLocalStorage();
            this.redirectToLogin();
        }
    }    clearLocalStorage() {
        //eliberez toate datele din localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        console.log('Local storage cleared');
    }

    redirectToLogin() {
        //schimba URL-ul pentru a redirectiona la pagina de login
        window.location.href = 'login.html';
    }
}

//logout functie 
async function logout() {
    if (window.authManager) {
        await window.authManager.logout();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    //initializare AuthManager  
    window.authManager = new AuthManager();
    
    //daca utilizatorul este autentificat, adauga event listener pentru logout
    if (window.authManager.checkAuth()) {
        const logoutLink = document.querySelector('a[href="#logout"]');
        if (logoutLink) {
            logoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await logout();
            });
        }
    }
});
