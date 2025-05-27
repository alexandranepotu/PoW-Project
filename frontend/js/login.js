document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', function(e) {
    const email = this.email.value.trim();
    const password = this.password.value.trim();

    if (!email || !password) {
      e.preventDefault();
      alert('Please fill in all fields');
    }
    // de adaugat????
  });
});
