document.addEventListener('DOMContentLoaded', function() {
  var loginForm = document.getElementById('loginForm');
  console.log('Login form found:', loginForm);

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Login form submitted');

    var username = loginForm.username.value.trim();
    var password = loginForm.password.value;

    if (!username || !password) {
      alert('Please fill in both username and password.');
      return;
    }    var data = { username: username, password: password };
    console.log('Sending login request with data:', data);
    
    var url = 'http://localhost/PoW-Project/backend/public/api/login';
    console.log('Request URL:', url);
      fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include', //includ cookie-urile pentru sesiune
      body: JSON.stringify(data)
    }).then(function(res) {
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      return res.text();
    })
    .then(function(text) {
      console.log('Raw response text:', text);
      
      var result;      try {
        result = JSON.parse(text);
        console.log('Parsed result:', result);
        //verif admin debug
        if (result.user) {
            console.log('User data:', result.user);
            console.log('Is admin?', result.user.is_admin);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        alert('Server returned invalid JSON: ' + text);
        return;
      }      var messageDiv = document.getElementById('message');      if (result.success) {
        console.log('Login successful, full response:', result);
        
        // Debug cookies
        console.log('All cookies after login:', document.cookie);
        if (result.token) {
            console.log('JWT token received:', result.token.substring(0, 50) + '...');
        }
        if (result.cookie_set !== undefined) {
            console.log('Cookie set result:', result.cookie_set);
        }
        
        // Store user data in localStorage
        if (result.user) {
            localStorage.setItem('userData', JSON.stringify(result.user));
            console.log('Stored user data in localStorage:', result.user);
            
            // Redirect based on admin status
            if (result.user.is_admin) {
                console.log('User is admin, redirecting to admin panel');
                window.location.href = 'admin.html';
            } else {
                console.log('User is not admin, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            }
        }
        messageDiv.style.color = 'green';        
        messageDiv.textContent = result.message;
        
        //data user in localstorage
        const userData = result.user;
        console.log('Storing user data:', userData);
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(userData));
        
        //user ID in localstorage
        const userId = userData.user_id || userData.id;
        if (userId) {
          localStorage.setItem('user_id', userId);
          console.log('User ID stored:', userId);
        } else {
          console.warn('No user_id found in login response!');
        }
        
        //verif daca e admin
        console.log('Checking admin status...');
        const isAdmin = userData.is_admin === true;
        console.log('Is admin?', isAdmin, 'Raw value:', userData.is_admin);
        
        loginForm.reset();
        
        //redirect bazat pe admin sau nu        // Allow some time for localStorage to be updated
        setTimeout(function() {
          if (isAdmin) {
            console.log('Redirecting to admin panel...');
            window.location.href = 'admin.html';
          } else {
            console.log('Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
          }
        }, 500);
      } else {
        console.log('Login failed');
        messageDiv.style.color = 'red';
        messageDiv.textContent = result.error || 'Login failed';
      }
    })
    .catch(function(err) {
      console.error('Error:', err);
      alert('Error connecting to server. Please try again.');
    });
  });
});