class GlobalThemeManager {
    constructor() {
        this.init();
        this.setupListeners();
    }    init() {
        console.log('GlobalThemeManager: Initializing...');
        //aplica tema imediat din localStorage sau preferintele sistemului
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        this.applyTheme(initialTheme);
        
        //initializeaza butonul de comutare a temei
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            console.log('GlobalThemeManager: Theme toggle button found, setting up');
            this.updateButtonIcon(initialTheme);
            this.setupToggleButton(toggleBtn);
        } else {
            console.log('GlobalThemeManager: No theme toggle button found');
        }

        console.log('Global theme initialized:', initialTheme);
    }

    setupListeners() {
        //asculta schimbarile din localstorage pentru tema
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme' && e.newValue) {
                this.applyTheme(e.newValue);
                const toggleBtn = document.querySelector('.theme-toggle');
                if (toggleBtn) {
                    this.updateButtonIcon(e.newValue);
                }
                console.log('Theme synchronized from storage:', e.newValue);
            }
        });

        //asculta schimbarile de tema ale sistemului
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            //doar aplica tema daca nu este deja setata in localStorage
            //pentru a evita suprascrierea unei teme deja setate de utilizator
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
                const toggleBtn = document.querySelector('.theme-toggle');
                if (toggleBtn) {
                    this.updateButtonIcon(newTheme);
                }
                console.log('System theme changed:', newTheme);
            }
        });
    }    setupToggleButton(toggleBtn) {
        console.log('GlobalThemeManager: Adding click listener to theme toggle');
        toggleBtn.addEventListener('click', () => {
            console.log('GlobalThemeManager: Theme toggle clicked');
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            console.log('GlobalThemeManager: Switching from', currentTheme, 'to', newTheme);
            this.applyTheme(newTheme);
            this.updateButtonIcon(newTheme);
            
            console.log('Theme toggled to:', newTheme);
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        //update meta theme-color pentru browserele mobile
        //pentru a schimba culoarea barei de adrese
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', 
                theme === 'dark' ? '#121212' : '#F9F5F9'
            );
        }

        //dispach event pentru a notifica alte componente
        //sau scripturi despre schimbarea temei
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
        
        console.log('Theme applied globally:', theme);
    }

    updateButtonIcon(theme) {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (!toggleBtn) return;

        //iconurile svg soare/luna
        const sunIcon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
        
        const moonIcon = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>';
        
        toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        toggleBtn.setAttribute('aria-label', 
            `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
        );
        
        console.log('Button icon updated for theme:', theme);
    }

    //metoda publica pt a obt tema crt
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // metoda publica pt a seta tema
    // accepta doar 'dark' sau 'light'
    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.applyTheme(theme);
            const toggleBtn = document.querySelector('.theme-toggle');
            if (toggleBtn) {
                this.updateButtonIcon(theme);
            }
        }
    }
}

//aplica tema imediat la incarcarea paginii
//daca nu este deja setata in localStorage sau daca utilizatorul nu are o preferinta
(function() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);
})();

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.globalThemeManager === 'undefined') {
        window.globalThemeManager = new GlobalThemeManager();
        console.log('GlobalThemeManager auto-initialized');
    }
});