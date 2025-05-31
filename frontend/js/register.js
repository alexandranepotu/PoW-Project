document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault(); //opreste comportamentul implicit al formularului

    const form = e.target; //form->referinta la formularul trimis
    const data = {
        full_name: form.full_name.value.trim(),
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        password: form.password.value
    };

    //trimite catre server datele->fetch
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await res.json(); //asteapta raspunsul de la server

        const messageDiv = document.getElementById('message');
        if (res.ok) {
            messageDiv.style.color = 'green';
            messageDiv.textContent = result.message;
            form.reset();
        } else {
            messageDiv.style.color = 'red';
            messageDiv.textContent = result.error || 'Unknown error occurred.';
        }
    } catch (err) {
        console.error(err);
        alert('Error occurred while processing your request. Please try again later.');
    }
});
