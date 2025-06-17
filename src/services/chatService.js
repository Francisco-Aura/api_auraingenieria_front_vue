import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class ChatService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(user, onMessageReceived, onUsersReceived) {
        try {
            if (this.stompClient && this.connected) {
                return;
            }

            const socket = new SockJS('http://localhost:8080/ws');
            this.stompClient = new Client({
                webSocketFactory: () => socket,
                onConnect: () => {
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    
                    // Suscribirse a mensajes públicos
                    this.stompClient.subscribe('/topic/public', onMessageReceived);
                    // Suscribirse a mensajes privados
                    this.stompClient.subscribe(`/user/${user.username}/queue/private`, onMessageReceived);
                    // Suscribirse a actualizaciones de usuarios
                    this.stompClient.subscribe('/topic/users', onUsersReceived);
                    
                    // Enviar información del usuario al conectarse
                    this.stompClient.publish({
                        destination: "/app/chat.addUser",
                        body: JSON.stringify(user)
                    });
                },
                onDisconnect: () => {
                    this.connected = false;
                    
                    // Intentar reconectar si no se ha alcanzado el límite
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        setTimeout(() => this.connect(user, onMessageReceived, onUsersReceived), 5000);
                    }
                },
                onStompError: (frame) => {
                    console.error('Error en la conexión STOMP:', frame);
                    this.connected = false;
                }
            });
            
            this.stompClient.activate();
        } catch (error) {
            console.error('Error al conectar al servidor de chat:', error);
            this.connected = false;
        }
    }

    disconnect() {
        try {
            if (this.stompClient && this.connected) {
                this.stompClient.publish({
                    destination: "/app/chat.leave"
                });
                this.stompClient.deactivate();
            }
        } catch (error) {
            console.error('Error al desconectar del servidor de chat:', error);
        } finally {
            this.stompClient = null;
            this.connected = false;
        }
    }

    sendMessage(message) {
        try {
            if (this.connected && this.stompClient) {
                if (message.receiver) {
                    // Mensaje privado
                    this.stompClient.publish({
                        destination: `/app/chat.private.${message.receiver}`,
                        body: JSON.stringify(message)
                    });
                } else {
                    // Mensaje público
                    this.stompClient.publish({
                        destination: "/app/chat.sendMessage",
                        body: JSON.stringify(message)
                    });
                }
            } else {
                console.warn('No se puede enviar mensaje: No hay conexión activa');
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    }

    sendFile(file, user, receiver) {
        try {
            if (this.connected && this.stompClient) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const message = {
                        sender: user.username,
                        receiver: receiver,
                        type: 'FILE',
                        fileName: file.name,
                        content: e.target.result
                    };
                    if (receiver) {
                        // Archivo privado
                        this.stompClient.publish({
                            destination: `/app/chat.private.${receiver}`,
                            body: JSON.stringify(message)
                        });
                    } else {
                        // Archivo público
                        this.stompClient.publish({
                            destination: "/app/chat.sendFile",
                            body: JSON.stringify(message)
                        });
                    }
                };
                reader.onerror = (error) => {
                    console.error('Error al leer el archivo:', error);
                };
                reader.readAsDataURL(file);
            } else {
                console.warn('No se puede enviar archivo: No hay conexión activa');
            }
        } catch (error) {
            console.error('Error al enviar archivo:', error);
        }
    }
}

export default new ChatService(); 