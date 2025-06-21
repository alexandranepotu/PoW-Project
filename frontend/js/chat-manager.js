class ChatManager {
    constructor() {
        this.activeRoom = null;
        this.rooms = new Map();
        this.currentUserId = localStorage.getItem('user_id');
        console.log('ChatManager initialized for user:', this.currentUserId);
        this.init();
    }

    init() {
        if (!this.currentUserId) {
            console.error('No user ID found. Chat functionality disabled.');
            return;
        }

        // Create chat tab
        this.createChatTab();
        // Set up polling for new messages
        this.startMessagePolling();
        
        console.log('Chat system initialized');
    }

    createChatTab() {
        const chatTab = document.createElement('div');
        chatTab.className = 'chat-tab';
        chatTab.innerHTML = `
            <span>💬 Chat</span>
            <span class="unread-count" style="display: none;">0</span>
        `;
        document.body.appendChild(chatTab);

        chatTab.addEventListener('click', () => this.toggleChatList());
        console.log('Chat tab created');
    }

    async createChatRoom(animalId, ownerName) {
        console.log('Creating chat room for animal:', animalId);
        try {
            if (!this.currentUserId) {
                alert('Please log in to chat with the owner');
                return;
            }

            const response = await fetch(`/PoW-Project/backend/public/api/chat/room/${animalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Chat room creation response:', data);

            if (data.success) {
                this.openChatRoom(data.room_id, ownerName);
            } else {
                console.error('Failed to create chat room:', data.error);
                alert('Could not start chat. Please try again later.');
            }
        } catch (error) {
            console.error('Error creating chat room:', error);
            alert('Could not start chat. Please try again later.');
        }
    }

    async openChatRoom(roomId, otherUserName) {
        console.log('Opening chat room:', roomId);
        
        if (this.rooms.has(roomId)) {
            const popup = this.rooms.get(roomId);
            popup.classList.remove('minimized');
            return;
        }

        const popup = this.createChatPopup(roomId, otherUserName);
        this.rooms.set(roomId, popup);
        document.body.appendChild(popup);
        
        await this.loadMessages(roomId);
        console.log('Chat room opened:', roomId);
    }

    createChatPopup(roomId, otherUserName) {
        const popup = document.createElement('div');
        popup.className = 'chat-popup slide-in';
        popup.innerHTML = `
            <div class="chat-header">
                <h3>Chat with ${otherUserName}</h3>
                <div class="buttons">
                    <button class="minimize">_</button>
                    <button class="close">×</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" placeholder="Type a message..." autocomplete="off">
                <button>Send</button>
            </div>
        `;

        this.setupChatPopupListeners(popup, roomId);
        return popup;
    }

    setupChatPopupListeners(popup, roomId) {
        const minimizeBtn = popup.querySelector('.minimize');
        const closeBtn = popup.querySelector('.close');
        const input = popup.querySelector('input');
        const sendBtn = popup.querySelector('button');

        minimizeBtn.addEventListener('click', () => {
            popup.classList.toggle('minimized');
        });

        closeBtn.addEventListener('click', () => {
            popup.classList.add('slide-out');
            setTimeout(() => {
                popup.remove();
                this.rooms.delete(roomId);
            }, 300);
        });

        const sendMessage = async () => {
            const message = input.value.trim();
            if (message) {
                await this.sendMessage(roomId, message);
                input.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    async sendMessage(roomId, message) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/chat/${roomId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                await this.loadMessages(roomId);
            } else {
                console.error('Failed to send message:', data.error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async loadMessages(roomId) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/chat/${roomId}/messages`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.updateChatMessages(roomId, data.messages);
            } else {
                console.error('Failed to load messages:', data.error);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }    updateChatMessages(roomId, messages) {
        const popup = this.rooms.get(roomId);
        if (!popup) return;

        const messagesContainer = popup.querySelector('.chat-messages');
        messagesContainer.innerHTML = '';

        messages.forEach(msg => {
            const isSentByMe = msg.sender_id === parseInt(this.currentUserId);
            console.log('Message:', {
                sender_id: msg.sender_id,
                currentUserId: this.currentUserId,
                isSentByMe: isSentByMe,
                message: msg.message
            });
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isSentByMe ? 'sent' : 'received'}`;
            messageDiv.innerHTML = `
                <div class="sender">${msg.sender_name}</div>
                <div class="content">${this.escapeHtml(msg.message)}</div>
                <div class="time">${new Date(msg.sent_at).toLocaleTimeString()}</div>
            `;
            messagesContainer.appendChild(messageDiv);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    startMessagePolling() {
        setInterval(() => {
            this.rooms.forEach((popup, roomId) => {
                if (!popup.classList.contains('minimized')) {
                    this.loadMessages(roomId);
                }
            });
        }, 5000);
    }

    toggleChatList() {
        let chatList = document.querySelector('.chat-list');
        if (!chatList) {
            chatList = this.createChatList();
            document.body.appendChild(chatList);
        }
        chatList.classList.toggle('show');
        if (chatList.classList.contains('show')) {
            this.loadUserChats();
        }
    }

    createChatList() {
        const chatList = document.createElement('div');
        chatList.className = 'chat-list';
        return chatList;
    }

    async loadUserChats() {
        try {
            const response = await fetch('/PoW-Project/backend/public/api/chat/rooms', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.updateChatList(data.chats);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    updateChatList(chats) {
        const chatList = document.querySelector('.chat-list');
        if (!chatList) return;

        chatList.innerHTML = chats.length ? '' : '<div class="no-chats">No active chats</div>';

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-list-item';
            chatItem.innerHTML = `
                <div class="chat-preview">
                    <div class="chat-title">${chat.animal_name}</div>
                    <div class="chat-last-message">${chat.last_message || 'No messages yet'}</div>
                </div>
                ${chat.unread_count ? `<span class="unread-badge">${chat.unread_count}</span>` : ''}
            `;

            chatItem.addEventListener('click', () => {
                this.openChatRoom(chat.room_id, chat.other_user_name);
                chatList.classList.remove('show');
            });

            chatList.appendChild(chatItem);
        });
    }
}
