class AdminManager {
    constructor() {
        this.init();
        this.setupEventListeners();
    }

    init() {
        console.log('AdminManager initializing...');
        this.checkAdminStatus().then(isAdmin => {
            console.log('Admin check result:', isAdmin);
            if (isAdmin) {
                this.loadUsers();
            }
        });
    }

    async checkAdminStatus() {
        try {
            const isAdmin = await authManager.checkAdminStatus();
            if (!isAdmin) {
                console.log('Not an admin user, redirecting...');
                window.location.href = 'login.html';
                return false;
            }
            console.log('Admin status confirmed');
            return true;
        } catch (error) {
            console.error('Error checking admin status:', error);
            window.location.href = 'login.html';
            return false;
        }
    }

    async loadUsers() {
        try {
            console.log('Fetching users...');
            const data = await apiClient.get('/admin/users');
            
            if (data.success && Array.isArray(data.users)) {
                console.log('Successfully loaded users:', data.users.length);
                this.renderUsers(data.users);
            } else {
                console.error('Unexpected response format:', data);
                throw new Error('Invalid response format from server');
            }        } catch (error) {
            console.error('Error loading users:', error.message);
            SharedUtilities.showMessage(`Failed to load users: ${error.message}`, 'error');
        }
    }

    renderUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) {
            console.error('Users table not found');
            return;
        }
          tbody.innerHTML = users.map(user => `
            <tr>
                <td>${SharedUtilities.escapeHtml(user.username)}</td>
                <td>${SharedUtilities.escapeHtml(user.email)}</td>
                <td>${SharedUtilities.escapeHtml(user.full_name || '')}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.total_pets || 0}</td>
                <td>
                    Adoptions Made: ${user.adoptions_made || 0}<br>
                    Pets Given: ${user.pets_adopted || 0}
                </td>
                <td>                    <button 
                        class="view-pets-btn" 
                        onclick="adminManager.viewUserPets(${user.user_id}, '${SharedUtilities.escapeHtml(user.username)}')"
                    >
                        View Pets
                    </button>
                    <button 
                        class="btn-delete" 
                        onclick="adminManager.showDeleteConfirmation(${user.user_id}, '${SharedUtilities.escapeHtml(user.username)}')"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }    setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.hideDeleteConfirmation());
        document.getElementById('confirmDelete')?.addEventListener('click', () => this.executeDelete());
    }

    showDeleteConfirmation(userId, username) {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.style.display = 'block';
            modal.dataset.userId = userId;
            modal.dataset.username = username;
        }
    }

    hideDeleteConfirmation() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.userId;
            delete modal.dataset.username;
        }
    }

    async executeDelete() {
        const modal = document.getElementById('confirmModal');
        const userId = modal?.dataset.userId;
        const username = modal?.dataset.username;
        
        if (!userId) return;

        try {
            console.log(`Attempting to delete user ${username} (ID: ${userId})`);
            await apiClient.delete(`/admin/users/${userId}`);            this.hideDeleteConfirmation();
            await this.loadUsers();
            SharedUtilities.showMessage(`User ${username} deleted successfully`, 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMessage = error.message.includes('SQLSTATE') ? 
                'Unable to delete user due to existing data. Please contact system administrator.' : 
                error.message;
            SharedUtilities.showMessage(`Failed to delete user: ${errorMessage}`, 'error');
        }
    }

    async handleLogout() {
        await authManager.logout();
    }

    viewUserPets(userId, username) {
        window.location.href = `user-pets.html?userId=${userId}&username=${encodeURIComponent(username)}`;
    }
}

function openNewsManager() {
    window.location.href = 'news-admin.html';
}

function viewRSSFeed() {
    window.open('../../backend/public/rss/feed.xml', '_blank');
}

async function loadNewsStats() {
    try {
        const data = await apiClient.get('/news');
        
        if (data.success && data.news) {
            document.getElementById('totalNews').textContent = data.news.length;
                if (data.news.length > 0) {
                const latestDate = new Date(Math.max(...data.news.map(n => new Date(n.created_at))));
                document.getElementById('lastUpdate').textContent = latestDate.toLocaleDateString();
                
                const recentNews = data.news.slice(0, 3);
                const recentNewsList = document.getElementById('recentNewsList');
                if (recentNewsList) {                    recentNewsList.innerHTML = recentNews.map(news => `
                        <div class="recent-news-item">
                            <h4>${SharedUtilities.escapeHtml(news.title)}</h4>
                            <p>${SharedUtilities.escapeHtml(news.content.substring(0, 100))}...</p>
                            <small>${new Date(news.created_at).toLocaleDateString()}</small>
                        </div>
                    `).join('');
                }
            } else {
                document.getElementById('lastUpdate').textContent = 'No news yet';
                document.getElementById('recentNewsList').innerHTML = '<p>No news articles found.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading news stats:', error);
        document.getElementById('totalNews').textContent = 'Error';
        document.getElementById('lastUpdate').textContent = 'Error';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
    loadNewsStats();
});
