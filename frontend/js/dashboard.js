document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');

    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        navbar.classList.toggle('menu-open');
    });

    //inchidere click-urile in afara meniului
    document.addEventListener('click', function(event) {
        if (!navbar.contains(event.target)) {
            menuToggle.classList.remove('active');
            navbar.classList.remove('menu-open');
        }
    });

    //resize event pentru a inchide meniul daca ecranul devine mai mare de 768px
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            menuToggle.classList.remove('active');
            navbar.classList.remove('menu-open');
        }
    });
});
