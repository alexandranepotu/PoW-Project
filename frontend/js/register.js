document.addEventListener('DOMContentLoaded', () => {
    console.log('JavaScript loaded'); // verificam daca se incarca js

    const form = document.getElementById('registerForm');
    console.log('Form found:', form); // verificam daca exista form

    form.addEventListener('submit', async function(e) {
        e.preventDefault(); //opreste trm clasica
        console.log('Form prevented default submit');

        //colectare date
        const data = {
            full_name: this.full_name.value.trim(),
            username: this.username.value.trim(),
            email: this.email.value.trim(),
            phone: this.phone.value.trim(),
            password: this.password.value
        };
        console.log('Data to send:', data);

        try {
            console.log('Sending request to:', '/PoW-Project/backend/public/api/register');
            const res = await fetch('/PoW-Project/backend/public/api/register', { //fol fetch pt a face cererea http
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)    //transformam datele in json
            });
            console.log('Full response:', res);

            const result = await res.json();
            console.log('Result:', result); // verificam rezultatul

            const messageDiv = document.getElementById('message');
            if (res.ok) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = result.message;
                form.reset();
            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = result.error || 'Unknown error occurred.';
            }
        } catch (err) {                  //erri
            console.error('Error:', err); 
            const messageDiv = document.getElementById('message');
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'Error connecting to server. Please try again.';
        }
    });
});
