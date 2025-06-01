document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;

    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
      });

      const result = await res.json();

      const messageDiv = document.getElementById('message');
      if (res.ok) {
        messageDiv.style.color = 'green';
        messageDiv.textContent = result.message;
        loginForm.reset();
        // Poți redirecționa utilizatorul după login, exemplu:
        // window.location.href = '/dashboard.html';
      } else {
        messageDiv.style.color = 'red';
        messageDiv.textContent = result.error || 'Login failed';
      }
    } catch (err) {
      console.error(err);
      alert('Eroare la procesarea cererii. Încearcă din nou.');
    }
  });
});
