class DashboardManager {
    constructor() {
    }

    init() {
        if (!authManager.checkAuth()) {
            return;
        }
        this.setupAdminLink();
    }

    async setupAdminLink() {
        try {
            const adminLink = document.getElementById('adminLink');
            if (!adminLink) return;

            const isAdmin = await authManager.checkAdminStatus();
            
            if (isAdmin) {
                console.log('Dashboard - User is admin, showing admin link');
                adminLink.style.display = 'block';
            } else {
                console.log('Dashboard - User is not admin, hiding admin link');
                adminLink.style.display = 'none';
                adminLink.style.visibility = 'hidden';
                adminLink.remove();
            }
        } catch (error) {
            console.error('Error setting up admin link:', error);
        }
    }

    async logout() {
        await authManager.logout();
    }
}

async function logout() {
    if (window.dashboardManager) {
        await window.dashboardManager.logout();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.authManager === 'undefined') {
        console.error('authManager not available, waiting...');
        setTimeout(() => {
            if (typeof window.authManager !== 'undefined') {
                window.dashboardManager = new DashboardManager();
                window.dashboardManager.init();
            } else {
                console.error('authManager still not available after waiting');
            }
        }, 100);
    } else {
        window.dashboardManager = new DashboardManager();
        window.dashboardManager.init();
    }
    
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    }
});
