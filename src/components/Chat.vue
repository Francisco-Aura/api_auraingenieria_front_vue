<template>
  <div class="chat-widget" :class="{ 'expanded': isExpanded }" :hidden="true">
    <!-- Botón de chat minimizado -->
    <div class="chat-minimized" @click="toggleChat">
      <div class="minimized-content">
        <i class="fas fa-comments"></i>
        <span class="unread-count" v-if="unreadCount > 0">{{ unreadCount }}</span>
      </div>
    </div>

    <!-- Chat expandido -->
    <div class="chat-expanded" v-if="isExpanded">
      <div class="chat-header">
        <div class="header-left">
          <h3>Chat</h3>
          <span class="status-indicator" :class="{ 'online': connected }">
            {{ connected ? 'En línea' : 'Desconectado' }}
          </span>
        </div>
        <div class="header-right">
          <button class="minimize-btn" @click="toggleChat">
            <i class="fas" :class="isExpanded ? 'fa-minus' : 'fa-plus'"></i>
          </button>
        </div>
      </div>

      <div class="chat-content">
        <!-- Lista de conversaciones -->
        <div class="conversations-list" v-if="!selectedUser">
          <div class="user-item" v-for="user in users" :key="user.id" @click="selectUser(user)">
            <div class="user-avatar">
              <i class="fas fa-user"></i>
              <span class="online-indicator" v-if="user.online"></span>
            </div>
            <div class="user-details">
              <span class="user-name">{{ user.nombre }}</span>
              <span class="user-status" :class="{ 'online': user.online }">
                {{ user.online ? 'En línea' : 'Última vez: ' + formatLastSeen(user.lastSeen) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Conversación seleccionada -->
        <div class="selected-conversation" v-else>
          <div class="conversation-header">
            <button class="back-btn" @click="selectedUser = null">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div class="user-info">
              <div class="user-avatar">
                <i class="fas fa-user"></i>
                <span class="online-indicator" v-if="selectedUser.online"></span>
              </div>
              <span class="user-name">{{ selectedUser.nombre }}</span>
            </div>
          </div>

          <div class="messages-container" ref="messagesContainer">
            <div v-for="(message, index) in messages" :key="index" 
                 :class="['message', message.sender === currentUser.username ? 'sent' : 'received']">
              <div class="message-content">
                <div v-if="message.type === 'FILE'" class="file-message">
                  <a :href="message.content" download>{{ message.fileName }}</a>
                </div>
                <div v-else>{{ message.content }}</div>
                <span class="message-time">{{ formatTimestamp(message.timestamp) }}</span>
              </div>
            </div>
          </div>

          <div class="message-input">
            <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Escribe un mensaje..." />
            <input type="file" @change="handleFileUpload" ref="fileInput" style="display: none" />
            <button class="file-btn" @click="$refs.fileInput.click()">
              <i class="fas fa-paperclip"></i>
            </button>
            <button class="send-btn" @click="sendMessage">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import chatService from '../services/chatService';

export default {
  name: 'ChatComponent',
  data() {
    return {
      currentUser: null,
      newMessage: '',
      messages: [],
      users: [],
      connected: false,
      isExpanded: false,
      selectedUser: null,
      unreadCount: 0,
      messageHandlers: {
        message: null,
        users: null
      }
    };
  },
  methods: {
    connect() {
      this.currentUser = JSON.parse(localStorage.getItem('usuario'));
      if (this.currentUser) {
        // Guardar las referencias a los manejadores para poder eliminarlos después
        this.messageHandlers.message = this.handleMessage.bind(this);
        this.messageHandlers.users = this.handleUsers.bind(this);
        
        chatService.connect(
          this.currentUser,
          this.messageHandlers.message,
          this.messageHandlers.users
        );
        this.connected = true;
      }
    },
    disconnect() {
      if (this.connected) {
        chatService.disconnect();
        this.connected = false;
        this.messages = [];
        this.users = [];
        this.selectedUser = null;
        this.isExpanded = false;
        this.unreadCount = 0;
      }
    },
    toggleChat() {
      this.isExpanded = !this.isExpanded;
      if (this.isExpanded) {
        this.unreadCount = 0;
      }
    },
    selectUser(user) {
      this.selectedUser = user;
      this.messages = [];
    },
    sendMessage() {
      if (this.newMessage.trim() && this.selectedUser && this.connected) {
        chatService.sendMessage({
          sender: this.currentUser.username,
          receiver: this.selectedUser.username,
          type: 'CHAT',
          content: this.newMessage
        });
        this.newMessage = '';
      }
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && this.selectedUser && this.connected) {
        chatService.sendFile(file, this.currentUser, this.selectedUser.username);
      }
    },
    handleMessage(message) {
      if (!this.$el) return; // Verificar si el componente sigue montado
      
      try {
        const parsedMessage = JSON.parse(message.body);
        this.messages.push(parsedMessage);
        
        if (!this.isExpanded || !this.selectedUser || 
            this.selectedUser.username !== parsedMessage.sender) {
          this.unreadCount++;
        }
        
        this.$nextTick(() => {
          if (this.$refs.messagesContainer) {
            this.scrollToBottom();
          }
        });
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
      }
    },
    handleUsers(users) {
      if (!this.$el) return; // Verificar si el componente sigue montado
      
      try {
        this.users = JSON.parse(users.body);
      } catch (error) {
        console.error('Error al procesar lista de usuarios:', error);
      }
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    formatLastSeen(timestamp) {
      if (!timestamp) return 'Nunca';
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
  },
  mounted() {
    this.connect();
  },
  beforeUnmount() {
    this.disconnect();
  },
  activated() {
    // Se ejecuta cuando el componente se reactiva (por ejemplo, al volver de otra página)
    if (!this.connected) {
      this.connect();
    }
  },
  deactivated() {
    // Se ejecuta cuando el componente se desactiva (por ejemplo, al navegar a otra página)
    this.disconnect();
  }
};
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

/* Asegurar que el chat esté por encima de los modales y otros elementos */
.chat-expanded {
  z-index: 10000;
}

/* Asegurar que el chat minimizado esté por encima de otros elementos */
.chat-minimized {
  z-index: 9999;
}

.chat-minimized {
  width: 60px;
  height: 60px;
  background-color: rgba(52, 58, 64, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-minimized:hover {
  transform: scale(1.1);
  background-color: rgba(73, 80, 87, 0.95);
}

.minimized-content {
  position: relative;
  color: rgba(173, 181, 189, 0.9);
  font-size: 1.5rem;
}

.unread-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgba(220, 53, 69, 0.9);
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.8rem;
  backdrop-filter: blur(5px);
}

.chat-expanded {
  width: 350px;
  height: 500px;
  background-color: rgba(52, 58, 64, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-header {
  padding: 15px;
  background-color: rgba(33, 37, 41, 0.9);
  color: rgba(173, 181, 189, 0.9);
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: rgba(173, 181, 189, 0.2);
  backdrop-filter: blur(5px);
}

.status-indicator.online {
  background-color: rgba(40, 167, 69, 0.8);
}

.minimize-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s ease;
  background-color: rgba(73, 80, 87, 0.7);
  margin-bottom: 5px;
  border: 1px solid rgba(108, 117, 125, 0.3);
  backdrop-filter: blur(5px);
}

.user-item:hover {
  background-color: rgba(108, 117, 125, 0.8);
  transform: translateX(5px);
}

.user-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  background-color: rgba(33, 37, 41, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: rgba(173, 181, 189, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: rgba(40, 167, 69, 0.8);
  border-radius: 50%;
  border: 2px solid rgba(52, 58, 64, 0.8);
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-weight: 500;
  color: rgba(248, 249, 250, 0.9);
}

.user-status {
  font-size: 0.8rem;
  color: rgba(173, 181, 189, 0.8);
}

.user-status.online {
  color: rgba(40, 167, 69, 0.8);
}

.selected-conversation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.conversation-header {
  padding: 15px;
  background-color: rgba(33, 37, 41, 0.9);
  color: rgba(173, 181, 189, 0.9);
  border-bottom: 1px solid rgba(73, 80, 87, 0.5);
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #adb5bd;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: rgba(52, 58, 64, 0.7);
}

.message {
  max-width: 80%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.message:hover {
  transform: scale(1.02);
}

.message.sent {
  align-self: flex-end;
}

.message.received {
  align-self: flex-start;
}

.message-content {
  padding: 10px 15px;
  border-radius: 15px;
  position: relative;
}

.message.sent .message-content {
  background-color: rgba(73, 80, 87, 0.8);
  color: rgba(248, 249, 250, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message.received .message-content {
  background-color: rgba(33, 37, 41, 0.8);
  color: rgba(248, 249, 250, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message-time {
  font-size: 0.7rem;
  color: rgba(173, 181, 189, 0.7);
  margin-top: 5px;
  display: block;
}

.message-input {
  padding: 15px;
  background-color: rgba(33, 37, 41, 0.9);
  border-top: 1px solid rgba(73, 80, 87, 0.5);
  display: flex;
  gap: 10px;
}

.message-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(73, 80, 87, 0.5);
  border-radius: 20px;
  outline: none;
  background-color: rgba(52, 58, 64, 0.7);
  color: rgba(248, 249, 250, 0.9);
  backdrop-filter: blur(5px);
}

.message-input input::placeholder {
  color: rgba(108, 117, 125, 0.7);
}

.message-input input:focus {
  border-color: rgba(173, 181, 189, 0.8);
  box-shadow: 0 0 0 0.2rem rgba(173, 181, 189, 0.25);
}

.file-btn, .send-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(173, 181, 189, 0.8);
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.file-btn:hover, .send-btn:hover {
  color: rgba(248, 249, 250, 0.9);
  transform: scale(1.1);
}
</style> 