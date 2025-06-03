class ThemeManager {
    constructor() {
        this.toggleBtn = document.querySelector('.theme-toggle');
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    init() {
        // Initialize theme based on priority:
        // 1. Previously selected theme
        // 2. System preference
        // 3. Default to light
        const savedTheme = localStorage.getItem('theme');
        const initialTheme = savedTheme || (this.prefersDark.matches ? 'dark' : 'light');
        
        this.applyTheme(initialTheme);
        this.setupListeners();
        this.updateButtonIcon(initialTheme);
        
        // Debug log
        console.log('Initial theme:', initialTheme);
    }

    setupListeners() {
        // Toggle button click
        this.toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            this.applyTheme(newTheme);
            this.updateButtonIcon(newTheme);
            
            // Debug log
            console.log('Theme toggled to:', newTheme);
        });

        // System theme changes
        this.prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
                this.updateButtonIcon(newTheme);
                
                // Debug log
                console.log('System theme changed:', newTheme);
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', 
                theme === 'dark' ? '#121212' : '#F9F5F9'
            );
        }
        
        // Debug log
        console.log('Theme applied:', {
            theme: theme,
            metaThemeColor: metaThemeColor?.getAttribute('content')
        });
    }

    updateButtonIcon(theme) {
        // Update button icon and accessibility
        this.toggleBtn.innerHTML = theme === 'dark' 
            ? '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>'
            : '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
        
        this.toggleBtn.setAttribute('aria-label', 
            `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
        );
        
        // Debug log
        console.log('Button icon updated:', {
            theme: theme,
            icon: this.toggleBtn.innerHTML
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
