document.addEventListener('DOMContentLoaded', function() {
    // Inbox dropdown logic
    (function() {
      const inboxDropdown = document.querySelector('.inbox-dropdown');
      if (!inboxDropdown) return;
      const inboxText = inboxDropdown.querySelector('.inbox-text');
      const dropdownContent = inboxDropdown.querySelector('.dropdown-content');
      let open = false;

      function openDropdown() {
        dropdownContent.classList.add('show');
        open = true;
      }
      function closeDropdown() {
        dropdownContent.classList.remove('show');
        open = false;
      }
      inboxText.addEventListener('click', function(e) {
        e.stopPropagation();
        if (open) closeDropdown();
        else openDropdown();
      });
      document.addEventListener('click', function(e) {
        if (!inboxDropdown.contains(e.target)) closeDropdown();
      });
    })();

    // Profile dropdown logic
    (function() {
      const profileDropdown = document.querySelector('.profile-dropdown');
      if (!profileDropdown) return;
      const profileText = profileDropdown.querySelector('.profile-text');
      const dropdownContent = profileDropdown.querySelector('.dropdown-content');
      let open = false;

      function openDropdown() {
        dropdownContent.classList.add('show');
        open = true;
      }
      function closeDropdown() {
        dropdownContent.classList.remove('show');
        open = false;
      }
      profileText.addEventListener('click', function(e) {
        e.stopPropagation();
        if (open) closeDropdown();
        else openDropdown();
      });
      document.addEventListener('click', function(e) {
        if (!profileDropdown.contains(e.target)) closeDropdown();
      });
    })();

    // Search input logic
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

    // Logout logic
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                window.location.href = 'login.html';
            }
        });
    }

    highlightCurrentPage();
});

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a[href]');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!link.classList.contains('logo') && !link.closest('.dropdown-content')) {
            if (href === currentPage || (currentPage === '' && href === 'dashboard.html')) {
                link.classList.add('active');
            }
        }
    });
}
