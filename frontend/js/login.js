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
      credentials: 'include', // Include cookies in request/response
      body: JSON.stringify(data)
    }).then(function(res) {
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      return res.text();
    })
    .then(function(text) {
      console.log('Raw response text:', text);
      
      var result;
      try {
        result = JSON.parse(text);
        console.log('Parsed result:', result);
      } catch (e) {
        console.error('JSON parse error:', e);
        alert('Server returned invalid JSON: ' + text);
        return;
      }      var messageDiv = document.getElementById('message');      // Check both response.ok and result.success
      if (result.success) {
        console.log('Login successful');
        messageDiv.style.color = 'green';        
        messageDiv.textContent = result.message;
        
        // JWT is now stored in httpOnly cookie, so we only store basic user info
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        console.log('LocalStorage set - isLoggedIn:', localStorage.getItem('isLoggedIn'));
        console.log('LocalStorage set - userData:', localStorage.getItem('userData'));
        console.log('JWT token stored securely in httpOnly cookie');
        
        loginForm.reset();
        
        // Redirect to dashboard
        console.log('Redirecting to dashboard...');
        window.location.href = '/PoW-Project/frontend/views/dashboard.html';
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