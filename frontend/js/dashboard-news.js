function fetchNews() {
    fetch('/PoW-Project/backend/public/news')
        .then(res => res.json())
        .then(data => {
            if (data.success && Array.isArray(data.news)) {
                renderNews(data.news);
            }
        });
}

function renderNews(newsList) {
    const newsSection = document.getElementById('news-section');
    if (!newsSection) return;
    newsSection.innerHTML = newsList.map(news => `
        <div class="news-item">
            <h3>${news.title}</h3>
            <p>${news.content}</p>
            <span class="news-date">${new Date(news.created_at).toLocaleString()}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    setInterval(fetchNews, 60000);
});
