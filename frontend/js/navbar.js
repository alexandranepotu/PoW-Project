document.addEventListener('DOMContentLoaded', function() {
    console.log('Navbar initialized via DropdownManager');
    
    const searchInput = document.querySelector('nav input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    console.log('Searching for:', searchTerm);
                }
            }
        });
    }

    const logoutLink = document.querySelector('a[href="#logout"]');
    console.log('Logout link found:', logoutLink);
    
    if (logoutLink) {
        console.log('Adding logout event listener');
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Logout clicked');
            
            if (confirm('Are you sure you want to logout?')) {
                try {
                    console.log('Making logout request');
                    const response = await fetch('/PoW-Project/backend/public/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    console.log('Logout response:', response);
                    
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('user_id');
                    
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            }
        });
    } else {
        console.log('No logout link found on this page');
    }

    highlightCurrentPage();
});

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}


