class CommunityMap {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.users = [];
        this.init();
    }

    async init() {
        this.initializeMap();
        await this.getUserLocation();
        await this.loadCommunityUsers();
    }

    initializeMap() {
        this.map = L.map('map').setView([45.9432, 24.9668], 7);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }    async getUserLocation() {
        try {
            const response = await fetch('/PoW-Project/backend/public/api/user/location', {
                method: 'GET',
                credentials: 'include'
            });            if (response.ok) {
                const userData = await response.json();
                
                if (userData.success && userData.location && userData.location.lat && userData.location.lng) {
                    this.userLocation = {
                        lat: userData.location.lat,
                        lng: userData.location.lng
                    };

                    this.map.setView([this.userLocation.lat, this.userLocation.lng], 12);

                    const userMarker = L.marker([this.userLocation.lat, this.userLocation.lng])
                        .addTo(this.map);

                    userMarker.bindPopup(`
                        <div class="popup-content">
                            <strong>🏠 My address</strong><br>
                            <small>📍 ${userData.address || 'Your address'}</small><br>
                            <small>From your profile</small>
                        </div>
                    `).openPopup();return; 
                }
            }
        } catch (error) {
            console.log('Error fetching user address:', error);
        }

        await this.tryGPSLocation();
    }

    async tryGPSLocation() {
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    });
                });                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.showNoAddressMessage();

                this.map.setView([this.userLocation.lat, this.userLocation.lng], 12);

                const gpsMarker = L.marker([this.userLocation.lat, this.userLocation.lng])
                    .addTo(this.map);                gpsMarker.bindPopup(`
                    <div class="popup-content">
                        <strong>📱 Your GPS location</strong><br>
                        <small>This is where you are currently</small><br>
                        <small style="color: orange;">⚠️ Set the address in profile</small>
                    </div>
                `).openPopup();} catch (error) {
                console.log('GPS error:', error);
                this.showLocationError();
            }
        } else {
            this.showLocationError();
        }
    }

    showNoAddressMessage() {
        const message = document.createElement('div');
        message.className = 'address-message';        message.style.cssText = `
            background: var(--accent-color);
            border: 2px solid var(--primary-color);
            border-radius: var(--border-radius-medium);
            padding: 20px;
            margin: 0 20px 20px 20px;
            text-align: center;
            color: var(--text-light);
            box-shadow: var(--shadow-large);
            font-weight: 500;
        `;        message.innerHTML = `
            <p><strong>📍 You haven't set your address</strong></p>
            <p>For a better experience, <a href="profile.html" style="color: var(--text-light); text-decoration: underline;">set your address in your profile</a></p>
            <small>We use GPS location as an alternative</small>
        `;
        
        const mapElement = document.getElementById('map');
        mapElement.parentNode.insertBefore(message, mapElement);
    }    async loadCommunityUsers() {
        try {
            const response = await fetch('/PoW-Project/backend/public/api/users/locations', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.users) {
                    this.users = data.users;
                    this.displayCommunityUsers();
                } else {
                    console.error('API returned error:', data.error || 'Unknown error');
                    this.users = [];
                }
            } else {
                console.error('HTTP error:', response.status, response.statusText);
                this.users = [];
            }
        } catch (error) {
            console.error('Error loading community users:', error);
            this.users = [];
        }
    }    displayCommunityUsers() {
        if (!Array.isArray(this.users)) {
            console.error('Users is not an array:', this.users);
            return;
        }
        
        this.users.forEach(user => {
            if (user.latitude && user.longitude) {
                const marker = L.marker([user.latitude, user.longitude])
                    .addTo(this.map);

                marker.bindPopup(`
                    <div class="popup-content">
                        <strong>👤 ${user.full_name || 'Utilizator'}</strong><br>
                        <small>📍 ${user.city || 'Unknown city'}</small><br>
                        ${user.pets_count ? `<small>🐾 ${user.pets_count} pets</small>` : ''}
                    </div>
                `);
            }
        });
    }    showLocationError() {
        const message = document.createElement('div');
        message.className = 'location-error-message';        message.style.cssText = `
            background: var(--primary-color);
            border: 2px solid var(--accent-color);
            border-radius: var(--border-radius-medium);
            padding: 20px;
            margin: 0 20px 20px 20px;
            text-align: center;
            color: var(--text-light);
            box-shadow: var(--shadow-large);
            font-weight: 500;
        `;        message.innerHTML = `
            <p><strong>❌ Unable to determine location</strong></p>
            <p>Please <a href="profile.html" style="color: var(--text-light); text-decoration: underline;">set your address in profile</a> or allow access to location.</p>
            <small>The map will show a general location in Romania.</small>
        `;
        
        const mapElement = document.getElementById('map');
        mapElement.parentNode.insertBefore(message, mapElement);
        
        this.map.setView([45.9432, 24.9668], 7);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map')) {
        new CommunityMap();
    }
});
