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
    }

    async checkAdminStatus() {
        try {
            const adminLink = document.getElementById('adminLink');
            if (!adminLink) return;

            const response = await fetch(`${this.apiUrl}/auth/check-admin`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.isAdmin) {
                    adminLink.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
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
            //indiferent daca logout-ul a reusit sau nu, curata localStorage si redirectioneaza la pagina de login
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
