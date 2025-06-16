//fct pt afisarea mesajelor
function showMessage(text, type, elementId = 'message') {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = text;
        messageElement.className = type;
        messageElement.classList.remove('hidden');

        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 3000);
    }
}

//fct pt incarcarea datelor din profile
function loadProfileData() {
    console.log('Loading profile data...');
    
    fetch('http://localhost/PoW-Project/backend/public/api/profile', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include' // Important pentru JWT cookie
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                console.error('Not authenticated, redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })    .then(data => {
        if (data && !data.error) {
            // populeaza inputurile cu datele primite 
            const fullNameInput = document.getElementById('fullName');
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');

            if (fullNameInput) fullNameInput.value = data.full_name || '';
            if (usernameInput) usernameInput.value = data.username || '';
            if (emailInput) emailInput.value = data.email || '';
            if (phoneInput) phoneInput.value = data.phone || '';
              console.log('Profile data loaded:', data);
        } else if (data && data.error) {
            console.error('Profile data error:', data.error);
            showMessage(data.error, 'error');
            if (data.error.includes('Authentication') || data.error.includes('token')) {
                window.location.href = 'login.html';
            }
        }
    })
    .catch(error => {
        console.error('Error loading profile:', error);
        showMessage('Error loading profile data: ' + error.message, 'error');
    });
}

//fct pt actualizarea profile
function updateProfile(formData) {
    // converteste formdata in json
    const data = Object.fromEntries(formData);
    
    fetch('http://localhost/PoW-Project/backend/public/api/profile/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        //verific daca raspunsul este JSON valid
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            //daca nu e json->citeste ca text pt debug
            return response.text().then(text => {
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response: ' + text);
            });
        }
        
        return response.json();
    })
    .then(data => {
        if (data.error) {
            showMessage(data.error, 'error');
        } else {
            showMessage(data.message, 'success');
            console.log('Profile updated successfully');
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    });
}

//fct pt incarcarea datelor ca adresa
function loadAddressData() {
    console.log('Loading address data...');
      fetch('http://localhost/PoW-Project/backend/public/api/address', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        console.log('Address response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                console.error('Not authenticated, redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            
            //pt alte erori
            return response.text().then(text => {
                console.error('Server error response:', text);
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || 'Server error');
                } catch (parseError) {
                    throw new Error(`Server error (${response.status}): ${text}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        if (data && data.address && !data.error) {
            //populeaza inputul cu datele primite
            const countryInput = document.getElementById('country');
            const countyInput = document.getElementById('county');
            const cityInput = document.getElementById('city');
            const streetInput = document.getElementById('street');
            const postalCodeInput = document.getElementById('postalCode');

            if (countryInput) countryInput.value = data.address.country || '';
            if (countyInput) countyInput.value = data.address.county || '';
            if (cityInput) cityInput.value = data.address.city || '';
            if (streetInput) streetInput.value = data.address.street || '';
            if (postalCodeInput) postalCodeInput.value = data.address.postal_code || '';
              
            console.log('Address data loaded:', data.address);
        } else if (data && data.error) {
            console.error('Address data error:', data.error);
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error loading address:', error);
        showMessage('Error loading address data: ' + error.message, 'error');
    });
}

// fct pt actualizarea adresei
function updateAddress(formData) {
    // converteste formdata in json 
  const data = Object.fromEntries(formData);
      //validare de baza
    if (!data.country || !data.city || !data.street) {
        showMessage('Country, city and street are required!', 'error', 'address-message');
        return;
    }
    
    console.log('Updating address with data:', data);
    
    fetch('http://localhost/PoW-Project/backend/public/api/address/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showMessage(data.error, 'error', 'address-message');
        } else {
            showMessage(data.message || 'Address updated successfully!', 'success', 'address-message');
            console.log('Address updated successfully');
        }
    })
    .catch(error => {
        console.error('Error updating address:', error);
        showMessage('Error updating address: ' + error.message, 'error', 'address-message');
    });
}
async function logout() {
    console.log('Starting logout process...');
    
    try {
        const response = await fetch('http://localhost/PoW-Project/backend/public/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Include JWT cookie
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Logout successful on server');
            showMessage('Logout successful!', 'success');
        } else {
            console.warn('Server logout failed:', result.error);
            showMessage('Logout completed (with server warning)', 'info');
        }
        
    } catch (error) {
        console.error('Logout API call failed:', error);
        showMessage('Logout completed (server unavailable)', 'info');
    } finally {
        //curata localStorage + redirectioneaza
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        
        console.log('Redirecting to login page...');
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // incarca datele - global-theme.js se ocupa de tema
    loadProfileData();
    loadAddressData();

    // listener pt formular info
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        console.log('Updating profile with data:', Object.fromEntries(formData));
        
        updateProfile(formData);
    });    //listener pt formular adresa
    document.getElementById('addressForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        console.log('Updating address with data:', Object.fromEntries(formData));
        
        updateAddress(formData);
    });

    //listener pt logout
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Logout link clicked');
            await logout();
        });
    } else {
        console.warn('Logout link not found in DOM');
    }
});