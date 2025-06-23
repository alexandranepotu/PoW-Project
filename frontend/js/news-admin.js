function updateThemeIcon(button, theme) {
    const sunIcon = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
    const moonIcon = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>';
    
    button.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

document.addEventListener('DOMContentLoaded', async function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    console.log('Applied theme on DOMContentLoaded:', savedTheme);
    
    if (!await checkAdminAuth()) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'login.html';
        return;
    }
    
    await loadNavbar();
    await loadCurrentNews();
});

async function checkAdminAuth() {
    try {
        const response = await fetch('../../backend/public/api/profile', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            return false;
        }
          const data = await response.json();
        return data.success && data.user && data.user.is_admin === true;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

async function loadNavbar() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`../templates/navbar-admin.html?t=${timestamp}`);        const navbarHtml = await response.text();        document.getElementById('navbar-container').innerHTML = navbarHtml;
        
        if (typeof initializeNavbar === 'function') {
            initializeNavbar();
        } else {
            setupNavbarEvents();        }
        
        setTimeout(() => {
            const themeButton = document.querySelector('.theme-toggle');
            if (themeButton) {
                console.log('Setting up theme toggle');
                
                const newButton = themeButton.cloneNode(true);
                themeButton.parentNode.replaceChild(newButton, themeButton);
                
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    const current = document.documentElement.getAttribute('data-theme') || 'light';
                    const newTheme = current === 'dark' ? 'light' : 'dark';
                    
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                    updateThemeIcon(this, newTheme);
                    
                    console.log('Theme switched to:', newTheme);
                });
                
                const savedTheme = localStorage.getItem('theme') || 'light';
                updateThemeIcon(newButton, savedTheme);
            }
        }, 200);
    } catch (error) {
        console.error('Error loading navbar:', error);
    }
}

function setupNavbarEvents() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        const profileText = profileDropdown.querySelector('.profile-text');
        const dropdownContent = profileDropdown.querySelector('.dropdown-content');
        
        if (profileText && dropdownContent) {
            profileText.addEventListener('click', function(e) {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
                dropdownContent.classList.toggle('show');
            });
            
            document.addEventListener('click', function() {
                profileDropdown.classList.remove('active');
                dropdownContent.classList.remove('show');
            });
        }
    }
    
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                try {
                    const response = await fetch('/PoW-Project/backend/public/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    localStorage.removeItem('userData');
                    localStorage.removeItem('userToken');
                    
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = 'login.html';
                }
            }
        });    }
}

document.addEventListener('DOMContentLoaded', function() {
    const addNewsForm = document.getElementById('addNewsForm');
    if (addNewsForm) {
        addNewsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            
            if (!title || !content) {
                showResult('addResult', 'Please fill in all fields', 'error');
                return;
            }
            
            try {
                const response = await fetch('../../backend/public/api/news', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: title,
                        content: content
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showResult('addResult', 'News article added successfully!', 'success');
                    document.getElementById('addNewsForm').reset();
                    loadCurrentNews();
                } else {
                    showResult('addResult', 'Error: ' + (result.error || 'Failed to add news'), 'error');
                }
            } catch (error) {
                console.error('Add news error:', error);
                showResult('addResult', 'Error: ' + error.message, 'error');
            }
        });
    }
});

async function importCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showResult('importResult', 'Please select a CSV file first', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('csvFile', file);
    
    try {
        const response = await fetch('../../backend/utils/NewsImporter.php?action=import-csv', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResult('importResult', `Imported ${result.imported || 0} articles successfully!`, 'success');
            loadCurrentNews();
            fileInput.value = ''; 
        } else {
            showResult('importResult', 'Error: ' + (result.error || 'Import failed'), 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        showResult('importResult', 'Error: ' + error.message, 'error');
    }
}

async function exportCSV() {
    try {
        const response = await fetch('../../backend/utils/NewsImporter.php?action=export-csv', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResult('exportResult', `Exported ${result.count || 0} articles to ${result.file || 'CSV file'}`, 'success');
            
            if (result.download_url) {
                const link = document.createElement('a');
                link.href = result.download_url;
                link.download = result.file || 'news_export.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            showResult('exportResult', 'Error: ' + (result.error || 'Export failed'), 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showResult('exportResult', 'Error: ' + error.message, 'error');
    }
}

async function importXML() {
    const fileInput = document.getElementById('xmlFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showResult('importXmlResult', 'Please select an XML file first', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('xmlFile', file);
    
    try {
        const response = await fetch('../../backend/utils/NewsImporter.php?action=import-xml', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            let message = `Imported ${result.imported || 0} articles successfully!`;
            if (result.errors && result.errors.length > 0) {
                message += ` (${result.errors.length} errors)`;
            }
            showResult('importXmlResult', message, 'success');
            loadCurrentNews();
            fileInput.value = '';
        } else {
            showResult('importXmlResult', 'Error: ' + (result.error || 'Import failed'), 'error');
        }
    } catch (error) {
        console.error('XML Import error:', error);
        showResult('importXmlResult', 'Error: ' + error.message, 'error');
    }
}

async function exportXML() {
    try {
        const response = await fetch('../../backend/utils/NewsImporter.php?action=export-xml', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResult('exportResult', `Exported ${result.count || 0} articles to ${result.file || 'XML file'}`, 'success');
            if (result.download_url) {
                const link = document.createElement('a');
                link.href = result.download_url;
                link.download = result.file || 'news_export.xml';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            showResult('exportResult', 'Error: ' + (result.error || 'XML Export failed'), 'error');
        }
    } catch (error) {
        console.error('XML Export error:', error);
        showResult('exportResult', 'Error: ' + error.message, 'error');
    }
}

async function loadCurrentNews() {
    try {
        const response = await fetch('../../backend/public/api/news', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.news && result.news.length > 0) {
            let html = '';
            result.news.forEach(news => {
                const publishDate = new Date(news.created_at).toLocaleString();
                const excerpt = news.content.length > 200 ? 
                    news.content.substring(0, 200) + '...' : 
                    news.content;
                  html += `
                    <div class="news-item">
                        <h4>${SharedUtilities.escapeHtml(news.title)}</h4>
                        <p>${SharedUtilities.escapeHtml(excerpt)}</p>
                        <small>Published: ${publishDate}</small>                        <div class="news-actions">
                            <button onclick="deleteNews(${news.news_id})" class="btn btn-danger btn-sm">Delete</button>
                        </div>
                    </div>
                `;
            });
            document.getElementById('currentNews').innerHTML = html;
        } else {
            document.getElementById('currentNews').innerHTML = '<p>No news articles found.</p>';
        }
    } catch (error) {
        console.error('Load news error:', error);
        document.getElementById('currentNews').innerHTML = '<p>Error loading news: ' + error.message + '</p>';
    }
}

async function deleteNews(newsId) {
    if (!newsId) {
        alert('Error: Invalid news ID');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this news article?')) {
        return;
    }
    
    try {
        console.log('Attempting to delete news ID:', newsId);
        const deleteUrl = `../../backend/public/api/news/${newsId}`;
        console.log('Delete URL:', deleteUrl);
        
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        console.log('Delete response status:', response.status);
        console.log('Delete response headers:', response.headers);
        
        if (!response.ok) {
            console.error('Delete request failed with status:', response.status);
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            alert('Error deleting news: Server returned ' + response.status);
            return;
        }
        
        const responseText = await response.text();
        console.log('Delete response text:', responseText);
        console.log('Delete response text length:', responseText.length);
        
        if (!responseText || responseText.trim().length === 0) {
            console.error('Empty response from server');
            alert('Error deleting news: Server returned empty response');
            return;
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response was not valid JSON:', responseText);
            alert('Error deleting news: Invalid server response');
            return;
        }
        
        if (result.success) {
            showResult('currentNews', 'News article deleted successfully!', 'success');
            loadCurrentNews();
        } else {
            alert('Error deleting news: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting news: ' + error.message);
    }
}

function showResult(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const resultDiv = document.createElement('div');
    resultDiv.className = `result-message ${type}`;
    resultDiv.textContent = message;
    
    element.insertBefore(resultDiv, element.firstChild);
    
    setTimeout(() => {        if (resultDiv.parentNode) {
            resultDiv.parentNode.removeChild(resultDiv);
        }
    }, 5000);
}
