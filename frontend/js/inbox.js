class InboxManager {
    constructor() {
        this.currentRoomId = null;
        this.conversations = [];
        this.currentUserId = null;
        this.messagePollInterval = null;
        this.isLoading = false; 
        this.init();
    }    async init() {
        await this.loadConversations();
        this.setupEventListeners();
        this.setupMessagePolling();
    }

    setupEventListeners() {
        const backBtn = document.getElementById('backToList');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showConversationsList());
        }

        const minimizeBtn = document.getElementById('minimizeChat');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.showConversationsList());
        }

        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageForm) {
                        messageForm.dispatchEvent(new Event('submit'));
                    }
                }
            });
        }

        window.addEventListener('resize', () => this.handleResize());
    }

    async loadConversations() {
        if (this.isLoading) {
            return;
        }
        
        try {
            this.isLoading = true;
            this.showLoading(true);
            
            const response = await fetch('/PoW-Project/backend/public/api/chat/conversations', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to load conversations');
            }

            const data = await response.json();
            this.conversations = data.conversations || [];
            this.currentUserId = data.current_user_id;
            
            this.renderConversations();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Failed to load conversations');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }renderConversations() {
        const container = document.getElementById('conversationsList');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        if (!container) {
            console.error('conversationsList element not found');
            return;
        }

        if (this.conversations.length === 0) {
            if (loadingState) loadingState.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            container.innerHTML = '';
            return;
        }

        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';

        const conversationsHTML = this.conversations.map(conv => this.renderConversationItem(conv)).join('');
        container.innerHTML = conversationsHTML;

        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const roomId = item.dataset.roomId;
                this.openConversation(roomId);
            });
        });
    }

    renderConversationItem(conversation) {
        const isUnread = conversation.unread_count > 0;
        const lastMessageTime = conversation.last_message_time ? 
            this.formatMessageTime(new Date(conversation.last_message_time)) : '';
        
        const otherUser = conversation.interested_user_id === this.currentUserId ? 
            conversation.owner_name : conversation.interested_user_name;

        return `
            <div class="conversation-item ${isUnread ? 'unread' : ''}" data-room-id="${conversation.room_id}">
                <div class="conversation-header">
                    <h3 class="conversation-title">${conversation.animal_name}</h3>
                    <span class="conversation-time">${lastMessageTime}</span>
                    ${isUnread ? `<span class="unread-badge">${conversation.unread_count}</span>` : ''}
                </div>
                <p class="conversation-subtitle">with ${otherUser}</p>
                <p class="conversation-preview">${conversation.last_message || 'No messages yet'}</p>
            </div>
        `;
    }

    async openConversation(roomId) {
        try {
            this.currentRoomId = roomId;
            
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.roomId === roomId) {
                    item.classList.add('active');
                    item.classList.remove('unread');
                }
            });

            const conversation = this.conversations.find(c => c.room_id == roomId);
            if (conversation) {
                this.setupChatHeader(conversation);
            }

            await this.loadMessages(roomId);
            
            this.showChatView();
            
            await this.markMessagesAsRead(roomId);
            
        } catch (error) {
            console.error('Error opening conversation:', error);
            this.showError('Failed to open conversation');
        }
    }

    setupChatHeader(conversation) {
        const chatTitle = document.getElementById('chatTitle');
        const chatSubtitle = document.getElementById('chatSubtitle');
        
        if (chatTitle) {
            chatTitle.textContent = conversation.animal_name;
        }
        
        if (chatSubtitle) {
            const otherUser = conversation.interested_user_id === this.currentUserId ? 
                conversation.owner_name : conversation.interested_user_name;
            chatSubtitle.textContent = `with ${otherUser}`;
        }
    }

    async loadMessages(roomId) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/chat/${roomId}/messages`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const data = await response.json();
            this.renderMessages(data.messages || []);
            
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('Failed to load messages');
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-message">No messages yet. Start the conversation!</div>';
            return;
        }

        const messagesHTML = messages.map(message => this.renderMessage(message)).join('');
        container.innerHTML = messagesHTML;

        container.scrollTop = container.scrollHeight;
    }

    renderMessage(message) {
        const isSent = message.sender_id == this.currentUserId;
        const messageTime = this.formatMessageTime(new Date(message.sent_at));
        
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-content">${this.escapeHtml(message.message)}</div>
                <div class="message-time">${messageTime}</div>
            </div>
        `;
    }

    async handleSendMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || !this.currentRoomId) return;

        try {
            const response = await fetch('/PoW-Project/backend/public/api/chat/send', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room_id: this.currentRoomId,
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            messageInput.value = '';

            await this.loadMessages(this.currentRoomId);
            
            await this.loadConversations();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
        }
    }

    async markMessagesAsRead(roomId) {
        try {
            await fetch(`/PoW-Project/backend/public/api/chat/mark-read/${roomId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }    }

    setupMessagePolling() {
        this.messagePollInterval = setInterval(async () => {
            if (this.currentRoomId) {
                await this.loadMessages(this.currentRoomId);
                if (Math.random() < 0.2) { 
                    await this.loadConversations();
                }
            }
        }, 5000);
    }

    showChatView() {
        const conversationsSidebar = document.getElementById('conversationsSidebar');
        const chatFullscreen = document.getElementById('chatFullscreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
        
        if (window.innerWidth <= 768) {
            if (conversationsSidebar) {
                conversationsSidebar.style.display = 'none';
            }
            if (chatFullscreen) {
                chatFullscreen.style.display = 'flex';
            }
        } else {
            if (chatFullscreen) {
                chatFullscreen.style.display = 'flex';
            }
        }
    }

    showConversationsList() {
        const conversationsSidebar = document.getElementById('conversationsSidebar');
        const chatFullscreen = document.getElementById('chatFullscreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        
        this.currentRoomId = null;
            if (chatFullscreen) {
            chatFullscreen.style.display = 'none';
        }
        
        if (window.innerWidth <= 768) {
            if (conversationsSidebar) {
                conversationsSidebar.style.display = 'flex';
            }
        } else {
            if (welcomeScreen) {
                welcomeScreen.style.display = 'flex';
            }
        }
        
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    updateStats() {
        const totalConversations = document.getElementById('totalConversations');
        const unreadCount = document.getElementById('unreadCount');
        
        if (totalConversations) {
            const count = this.conversations.length;
            totalConversations.textContent = `${count} conversation${count !== 1 ? 's' : ''}`;
        }
        
        if (unreadCount) {
            const unread = this.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
            unreadCount.textContent = `${unread} unread`;
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('conversationsList');
        if (container && !document.querySelector('.error-state')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-state';
            errorDiv.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--accent-color);">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn-primary">Retry</button>
                </div>
            `;
            container.appendChild(errorDiv);
        }
    }

    formatMessageTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffHours < 1) {
            const minutes = Math.floor(diffMs / (1000 * 60));
            return minutes < 1 ? 'now' : `${minutes}m ago`;
        } else if (diffHours < 24) {
            return `${Math.floor(diffHours)}h ago`;
        } else if (diffDays < 7) {
            return `${Math.floor(diffDays)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleResize() {
        if (this.currentRoomId) {
            this.showChatView();
        } else {
            this.showConversationsList();
        }
    }

    destroy() {
        if (this.messagePollInterval) {
            clearInterval(this.messagePollInterval);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.inboxManager = new InboxManager();
});

window.addEventListener('beforeunload', () => {
    if (window.inboxManager) {
        window.inboxManager.destroy();
    }
});
