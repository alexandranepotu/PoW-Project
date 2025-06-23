class DropdownManager {
    static initializeDropdowns() {
        console.log('DropdownManager: Initializing dropdowns...');
  
        this.verifyCSSLoaded();
        
        this.initializeInboxDropdown();
        this.initializeProfileDropdown();
    }

    static verifyCSSLoaded() {
        const testElement = document.createElement('div');
        testElement.className = 'dropdown-content show';
        testElement.style.visibility = 'hidden';
        testElement.style.position = 'absolute';
        document.body.appendChild(testElement);
        
        const styles = window.getComputedStyle(testElement);
        const display = styles.display;
        
        document.body.removeChild(testElement);
        
        if (display === 'block') {
            console.log('DropdownManager: CSS loaded correctly - .show class works');
        } else {
            console.warn('DropdownManager: CSS may not be loaded - .show class display:', display);
        }
    }

    static initializeInboxDropdown() {
        const dropdown = document.querySelector('.inbox-dropdown');
        if (!dropdown) {
            console.log('DropdownManager: No inbox dropdown found');
            return;
        }

        const trigger = dropdown.querySelector('.inbox-text');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (!trigger || !content) {
            console.log('DropdownManager: Inbox dropdown missing trigger or content');
            return;
        }

        console.log('DropdownManager: Setting up inbox dropdown');
        this.setupDropdown(dropdown, trigger, content);
    }

    static initializeProfileDropdown() {
        const dropdown = document.querySelector('.profile-dropdown');
        if (!dropdown) {
            console.log('DropdownManager: No profile dropdown found');
            return;
        }

        const trigger = dropdown.querySelector('.profile-text');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (!trigger || !content) {
            console.log('DropdownManager: Profile dropdown missing trigger or content');
            return;
        }

        console.log('DropdownManager: Setting up profile dropdown');
        this.setupDropdown(dropdown, trigger, content);
    }    static setupDropdown(dropdown, trigger, content) {
        if (dropdown._dropdownInitialized) {
            console.log('DropdownManager: Dropdown already initialized, skipping');
            return;
        }
        
        let isOpen = false;
        console.log('DropdownManager: Setting up dropdown events');

        const openDropdown = () => {
            console.log('DropdownManager: Opening dropdown');
            content.classList.add('show');
            dropdown.classList.add('active');
            isOpen = true;
        };

        const closeDropdown = () => {
            console.log('DropdownManager: Closing dropdown');
            content.classList.remove('show');
            dropdown.classList.remove('active');
            isOpen = false;
        };        const toggleDropdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('DropdownManager: Toggling dropdown, current state:', isOpen);
            if (isOpen) {
                closeDropdown();
            } else {
                DropdownManager.closeAllDropdowns();
                openDropdown();
            }
        };

        trigger.addEventListener('click', toggleDropdown);

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && isOpen) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        });

        dropdown._dropdownInitialized = true;

        dropdown._dropdownManager = {
            close: closeDropdown,
            open: openDropdown,
            toggle: toggleDropdown
        };
    }

    static closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.inbox-dropdown, .profile-dropdown');
        dropdowns.forEach(dropdown => {
            const content = dropdown.querySelector('.dropdown-content');
            if (content) {
                content.classList.remove('show');
                dropdown.classList.remove('active');
            }
        });
    }    static destroy() {
        const dropdowns = document.querySelectorAll('.inbox-dropdown, .profile-dropdown');
        dropdowns.forEach(dropdown => {
            if (dropdown._dropdownManager) {
                delete dropdown._dropdownManager;
            }
            dropdown._dropdownInitialized = false;
        });
    }

    static reinitialize() {
        console.log('DropdownManager: Reinitializing dropdowns...');
        this.destroy();
        setTimeout(() => {
            this.initializeDropdowns();
        }, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            DropdownManager.initializeDropdowns();
        }, 100);
    });
} else {
    setTimeout(() => {
        DropdownManager.initializeDropdowns();
    }, 100);
}

window.DropdownManager = DropdownManager;
