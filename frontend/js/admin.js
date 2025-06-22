class AdminManager {
    constructor() {
        this.init();
        this.setupEventListeners();
    }

    init() {
        //verif status admin si incarca utilizatorii doar daca este admin
        console.log('AdminManager initializing...');
        this.checkAdminStatus().then(isAdmin => {
            console.log('Admin check result:', isAdmin);
            if (isAdmin) {
                this.loadUsers();
            }
        });
    }    async checkAdminStatus() {
        try {
            //verif localstorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            console.log('Checking admin status from userData:', userData);
            
            if (!userData || !userData.is_admin) {
                console.log('Not an admin user according to local storage');
                window.location.href = 'login.html';
                return false;
            }

            //verific si la server
            console.log('Checking admin status with server...');
            const response = await fetch('http://localhost/PoW-Project/backend/public/api/auth/check-admin', {
                method: 'GET',
                credentials: 'include'
            });

            console.log('Server response:', response.status);
            
            if (!response.ok) {
                console.log('Server rejected admin status:', response.status);
                window.location.href = 'login.html';
                return false;
            }            const data = await response.json();
            console.log('Server response data:', data);
            
            if (!data.is_admin) {
                console.log('Not an admin according to server check');
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
    }    async loadUsers() {
        try {
            console.log('Fetching users...');
            const response = await fetch('http://localhost/PoW-Project/backend/public/api/admin/users', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Users response status:', response.status);
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status} ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed response data:', data);
            } catch (e) {
                console.error('JSON parse error:', e);
                throw new Error('Invalid JSON response from server');
            }

            if (data.success && Array.isArray(data.users)) {
                console.log('Successfully loaded users:', data.users.length);
                this.renderUsers(data.users);
            } else {
                console.error('Unexpected response format:', data);
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error loading users:', error.message);
            console.error('Error stack:', error.stack);
            alert(`Failed to load users: ${error.message}`);
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
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${this.escapeHtml(user.full_name || '')}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.total_pets || 0}</td>
                <td>
                    Adoptions Made: ${user.adoptions_made || 0}<br>
                    Pets Given: ${user.pets_adopted || 0}
                </td>
                <td>
                    <button 
                        class="btn-delete" 
                        onclick="adminManager.showDeleteConfirmation(${user.user_id}, '${this.escapeHtml(user.username)}')"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.hideDeleteConfirmation());
        document.getElementById('confirmDelete')?.addEventListener('click', () => this.executeDelete());

        const profileDropdown = document.querySelector('.profile-dropdown');
        const profileText = document.querySelector('.profile-text');

        if (profileText && profileDropdown) {
            profileText.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('active');
                }
            });
        }
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
    }    async executeDelete() {
        const modal = document.getElementById('confirmModal');
        const userId = modal?.dataset.userId;
        const username = modal?.dataset.username;
        
        if (!userId) return;

        try {
            console.log(`Attempting to delete user ${username} (ID: ${userId})`);
            const response = await fetch(`http://localhost/PoW-Project/backend/public/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();
            console.log('Delete response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response:', e);
                throw new Error('Server returned invalid response');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            this.hideDeleteConfirmation();
            await this.loadUsers();
            alert(`User ${username} deleted successfully`);
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMessage = error.message.includes('SQLSTATE') ? 
                'Unable to delete user due to existing data. Please contact system administrator.' : 
                error.message;
            alert(`Failed to delete user: ${errorMessage}`);
        }
    }

    async handleLogout() {
        try {
            await fetch('/PoW-Project/backend/public/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize admin manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
