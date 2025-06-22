document.addEventListener('DOMContentLoaded', () => {
    const newsSection = document.getElementById('news-section');
    if (newsSection) {        newsSection.innerHTML = `
            <h1 class="news-message">
                Curious about what's new? Click on the button on the top right and see our RSS feed!
            </h1>
        `;
    }
});
