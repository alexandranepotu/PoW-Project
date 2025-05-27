document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', function(e) {
    const name = this.name.value.trim();
    const email = this.email.value.trim();
    const phone = this.phone.value.trim();
    const password = this.password.value.trim();

    if (!name || !email || !phone || !password) {
      e.preventDefault();
      alert('Please fill in all fields');
    } else if (password.length < 6) {
      e.preventDefault();
      alert('Password must be at least 6 characters');
    }
    //de adaugat mai multe???
  });
});
