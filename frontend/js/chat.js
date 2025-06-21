class ChatManager {
    constructor() {
        this.activeRoom = null;
        this.rooms = new Map();
        this.init();
    }

    init() {
        //creeaza tab-ul de chat
        const chatTab = document.createElement('div');
        chatTab.className = 'chat-tab';
        chatTab.textContent = 'Chat';
        document.body.appendChild(chatTab);

        //creeaa lista de chat
        const chatList = document.createElement('div');
        chatList.className = 'chat-list';
        document.body.appendChild(chatList);

        //dechide lista de chat
        chatTab.addEventListener('click', () => {
            chatList.classList.toggle('show');
            if (chatList.classList.contains('show')) {
                this.loadUserChats();
            }
        });

        //se inchide lista de chat daca se da click in afara
        document.addEventListener('click', (e) => {
            if (!chatTab.contains(e.target) && !chatList.contains(e.target)) {
                chatList.classList.remove('show');
            }
        });

        //verif pt msj noi la fiecare 5 sec
        setInterval(() => this.checkNewMessages(), 5000);
    }

    async createChatRoom(animalId) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/chat/room/${animalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                this.openChatRoom(data.room_id);
            } else {
                console.error('Error creating chat room:', data.error);
            }
        } catch (error) {
            console.error('Error creating chat room:', error);
        }
    }

    async openChatRoom(roomId) {
        //se creeaza popup daca nu exista deja
        if (!this.rooms.has(roomId)) {
            const popup = this.createChatPopup(roomId);
            this.rooms.set(roomId, popup);
            document.body.appendChild(popup);
            
            //incarca msj
            await this.loadMessages(roomId);
        }

        //arata popup
        const popup = this.rooms.get(roomId);
        popup.classList.remove('minimized');
        this.activeRoom = roomId;
    }

    createChatPopup(roomId) {
        const popup = document.createElement('div');
        popup.className = 'chat-popup slide-in';
        popup.innerHTML = `
            <div class="chat-header">
                <h3>Chat</h3>
                <div class="buttons">
                    <button class="minimize">_</button>
                    <button class="close">×</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" placeholder="Type a message...">
                <button>Send</button>
            </div>
        `;

        //event listeners
        const header = popup.querySelector('.chat-header');
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

        return popup;
    }

    async sendMessage(roomId, message) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/chat/${roomId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            
            if (data.success) {
                await this.loadMessages(roomId);
            } else {
                console.error('Error sending message:', data.error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async loadMessages(roomId) {
        try {
            const response = await fetch(`/PoW-Project/backend/public/api/chat/${roomId}/messages`);
            const data = await response.json();
            
            if (data.success) {
                const popup = this.rooms.get(roomId);
                const messagesContainer = popup.querySelector('.chat-messages');
                messagesContainer.innerHTML = '';

                data.messages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`;
                    messageDiv.innerHTML = `
                        <div class="sender">${msg.sender_name}</div>
                        <div class="content">${msg.message}</div>
                        <div class="time">${new Date(msg.sent_at).toLocaleTimeString()}</div>
                    `;
                    messagesContainer.appendChild(messageDiv);
                });

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                console.error('Error loading messages:', data.error);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async loadUserChats() {
        try {
            const response = await fetch('/PoW-Project/backend/public/api/chat/rooms');
            const data = await response.json();
            
            if (data.success) {
                const chatList = document.querySelector('.chat-list');
                chatList.innerHTML = '';

                data.chats.forEach(chat => {
                    const chatItem = document.createElement('div');
                    chatItem.className = 'chat-list-item';
                    chatItem.innerHTML = `
                        <div>
                            <div>${chat.animal_name}</div>
                            <div class="last-message">${chat.last_message || 'No messages yet'}</div>
                        </div>
                        ${chat.unread_count > 0 ? `<span class="unread">${chat.unread_count}</span>` : ''}
                    `;
                    
                    chatItem.addEventListener('click', () => {
                        this.openChatRoom(chat.room_id);
                        document.querySelector('.chat-list').classList.remove('show');
                    });
                    
                    chatList.appendChild(chatItem);
                });
            } else {
                console.error('Error loading chats:', data.error);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    async checkNewMessages() {
        if (this.activeRoom) {
            await this.loadMessages(this.activeRoom);
        }
        if (document.querySelector('.chat-list').classList.contains('show')) {
            await this.loadUserChats();
        }
    }
}

//init chatmanager cande se incarca dom
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});
