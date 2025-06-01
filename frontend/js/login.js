document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  console.log('Login form found:', loginForm);

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Login form submitted');

    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;

    if (!username || !password) {
      alert('Please fill in both username and password.');
      return;
    }    try {
      const data = { username, password };
      console.log('Sending login request with data:', data);
      console.log('JSON body:', JSON.stringify(data));
      
      const url = '/PoW-Project/backend/public/api/login';
      console.log('Request URL:', url);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
//debug
    const text = await res.text();
    console.log('Raw response text:', text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e);
      alert('Server returned invalid JSON:\n' + text);
      return;
    }


      const messageDiv = document.getElementById('message');
      if (res.ok) {
        messageDiv.style.color = 'green';        
        messageDiv.textContent = result.message;
        loginForm.reset();
        // redirectionarea utilizatorului dupa login
        window.location.href = '/PoW-Project/frontend/views/dashboard.html'; //login->dashboard
      } else {
        messageDiv.style.color = 'red';
        messageDiv.textContent = result.error || 'Login failed';
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server. Please try again.');
    }
  });
});
