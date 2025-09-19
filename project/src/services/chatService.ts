import { API_ENDPOINTS, httpClient } from '../config/api';

export interface ChatRoom {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }>;
  businessIdeaId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    investmentNeeded: number;
  };
  investmentProposalId: {
    _id: string;
    amount: number;
    type: string;
    status: string;
  };
  lastMessage?: {
    content: string;
    senderId: {
      _id: string;
      name: string;
      avatar?: string;
    };
    timestamp: string;
  };
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatRoomId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: string;
  editedAt?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  content: string;
  messageType?: 'text' | 'file' | 'system';
}

export interface CreateChatRoomData {
  investmentProposalId: string;
}

class ChatService {
  private socket: any = null;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Initialize Socket.IO connection
  async initializeSocket(token: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Not in browser environment, skipping socket initialization');
        return null;
      }

      // Dynamic import for Socket.IO client
      const { default: io } = await import('socket.io-client');
      
      this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to chat server');
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from chat server');
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to load Socket.IO client:', error);
      return null;
    }
  }

  // Join user's personal room
  joinUserRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('join_user', { userId });
    } else {
      console.warn('Socket not initialized, cannot join user room');
    }
  }

  // Join chat room
  joinChatRoom(chatRoomId: string) {
    if (this.socket) {
      this.socket.emit('join_chat_room', { chatRoomId });
    } else {
      console.warn('Socket not initialized, cannot join chat room');
    }
  }

  // Leave chat room
  leaveChatRoom(chatRoomId: string) {
    if (this.socket) {
      this.socket.emit('leave_chat_room', { chatRoomId });
    } else {
      console.warn('Socket not initialized, cannot leave chat room');
    }
  }

  // Send typing indicator
  sendTypingIndicator(chatRoomId: string, userId: string, userName: string) {
    if (this.socket) {
      this.socket.emit('typing_start', { chatRoomId, userId, userName });
    } else {
      console.warn('Socket not initialized, cannot send typing indicator');
    }
  }

  // Stop typing indicator
  stopTypingIndicator(chatRoomId: string, userId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', { chatRoomId, userId });
    } else {
      console.warn('Socket not initialized, cannot stop typing indicator');
    }
  }

  // Set up typing indicator with debounce
  setupTypingIndicator(chatRoomId: string, userId: string, userName: string) {
    // Clear existing timeout
    const key = `${chatRoomId}-${userId}`;
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!);
    }

    // Send typing indicator
    this.sendTypingIndicator(chatRoomId, userId, userName);

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      this.stopTypingIndicator(chatRoomId, userId);
      this.typingTimeouts.delete(key);
    }, 2000);

    this.typingTimeouts.set(key, timeout);
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.typingTimeouts.clear();
  }

  // API Methods
  async getChatRooms(): Promise<{ success: boolean; data: { chatRooms: ChatRoom[] } }> {
    return await httpClient.get(API_ENDPOINTS.CHAT.ROOMS);
  }

  async getChatRoom(chatRoomId: string): Promise<{ success: boolean; data: { chatRoom: ChatRoom; messages: Message[]; unreadCount: number } }> {
    return await httpClient.get(API_ENDPOINTS.CHAT.SINGLE_ROOM(chatRoomId));
  }

  async sendMessage(chatRoomId: string, messageData: SendMessageData): Promise<{ success: boolean; data: { message: Message } }> {
    return await httpClient.post(API_ENDPOINTS.CHAT.SEND_MESSAGE(chatRoomId), messageData);
  }

  async createChatRoomFromProposal(data: CreateChatRoomData): Promise<{ success: boolean; data: { chatRoom: ChatRoom } }> {
    return await httpClient.post(API_ENDPOINTS.CHAT.CREATE_FROM_PROPOSAL, data);
  }

  async markMessagesAsRead(chatRoomId: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.put(API_ENDPOINTS.CHAT.MARK_READ(chatRoomId));
  }

  async getUnreadCount(): Promise<{ success: boolean; data: { unreadCount: number } }> {
    return await httpClient.get(API_ENDPOINTS.CHAT.UNREAD_COUNT);
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.delete(API_ENDPOINTS.CHAT.DELETE_MESSAGE(messageId));
  }

  async deleteChatRoom(chatRoomId: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.delete(API_ENDPOINTS.CHAT.DELETE_ROOM(chatRoomId));
  }

  async uploadFileToChat(chatRoomId: string, file: File): Promise<{ success: boolean; data: { message: Message } }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(API_ENDPOINTS.CHAT.SINGLE_ROOM(chatRoomId) + '/upload', {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'File upload failed');
    }
    return response.json();
  }

  // Socket event listeners
  onNewMessage(callback: (data: { message: Message; chatRoomId: string }) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageDeleted(callback: (data: { messageId: string; chatRoomId: string }) => void) {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  onUserTyping(callback: (data: { userId: string; userName: string }) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback: (data: { userId: string }) => void) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  onUserStatusChange(callback: (data: { userId: string; status: string }) => void) {
    if (this.socket) {
      this.socket.on('user_status_change', callback);
    }
  }

  // Remove event listeners
  offNewMessage() {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  offMessageDeleted() {
    if (this.socket) {
      this.socket.off('message_deleted');
    }
  }

  offUserTyping() {
    if (this.socket) {
      this.socket.off('user_typing');
    }
  }

  offUserStoppedTyping() {
    if (this.socket) {
      this.socket.off('user_stopped_typing');
    }
  }

  offUserStatusChange() {
    if (this.socket) {
      this.socket.off('user_status_change');
    }
  }
}

export const chatService = new ChatService(); 