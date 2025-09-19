import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatService, ChatRoom, Message, SendMessageData, CreateChatRoomData } from '../services/chatService';
import { useAuthStore } from './authStore';
import toast from 'react-hot-toast';

interface ChatState {
  // Chat rooms
  chatRooms: ChatRoom[];
  selectedChatRoom: ChatRoom | null;
  chatRoomsLoading: boolean;
  chatRoomsError: string | null;

  // Messages
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;

  // Real-time state
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
  unreadCount: number;

  // Actions
  // Chat rooms
  fetchChatRooms: () => Promise<void>;
  selectChatRoom: (chatRoom: ChatRoom | null) => void;
  createChatRoomFromProposal: (data: CreateChatRoomData) => Promise<boolean>;
  deleteChatRoom: (chatRoomId: string) => Promise<boolean>;
  fetchAndSelectChatRoomById: (chatRoomId: string) => Promise<void>;

  // Messages
  fetchMessages: (chatRoomId: string) => Promise<void>;
  sendMessage: (chatRoomId: string, messageData: SendMessageData) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markMessagesAsRead: (chatRoomId: string) => Promise<void>;
  uploadFileToChat: (chatRoomId: string, file: File) => Promise<boolean>;

  // Real-time
  addMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  updateUnreadCount: (count: number) => void;

  // Socket management
  initializeSocket: () => void;
  disconnectSocket: () => void;
  joinChatRoom: (chatRoomId: string) => void;
  leaveChatRoom: (chatRoomId: string) => void;
  setupTypingIndicator: (chatRoomId: string, userId: string, userName: string) => void;

  // Utility
  clearErrors: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      chatRooms: [],
      selectedChatRoom: null,
      chatRoomsLoading: false,
      chatRoomsError: null,

      messages: [],
      messagesLoading: false,
      messagesError: null,

      typingUsers: new Set(),
      onlineUsers: new Set(),
      unreadCount: 0,

      // Chat rooms actions
      fetchChatRooms: async () => {
        set({ chatRoomsLoading: true, chatRoomsError: null });

        try {
          const response = await chatService.getChatRooms();

          if (response.success) {
            set({
              chatRooms: response.data.chatRooms,
              chatRoomsLoading: false,
            });
          } else {
            set({
              chatRoomsError: 'Failed to fetch chat rooms',
              chatRoomsLoading: false,
            });
          }
        } catch (error: any) {
          set({
            chatRoomsError: error.message || 'Failed to fetch chat rooms',
            chatRoomsLoading: false,
          });
        }
      },

      selectChatRoom: (chatRoom: ChatRoom | null) => {
        set({ selectedChatRoom: chatRoom });
        
        // Leave previous room and join new one
        const { selectedChatRoom } = get();
        if (selectedChatRoom && selectedChatRoom._id !== chatRoom?._id) {
          get().leaveChatRoom(selectedChatRoom._id);
        }
        
        if (chatRoom) {
          get().joinChatRoom(chatRoom._id);
          get().fetchMessages(chatRoom._id);
          get().markMessagesAsRead(chatRoom._id);
        }
      },

      createChatRoomFromProposal: async (data: CreateChatRoomData) => {
        try {
          const response = await chatService.createChatRoomFromProposal(data);

          if (response.success) {
            const newChatRoom = response.data.chatRoom;
            set(state => ({
              chatRooms: [newChatRoom, ...state.chatRooms]
            }));
            
            toast.success('Chat room created successfully');
            return true;
          } else {
            toast.error('Failed to create chat room');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to create chat room');
          return false;
        }
      },

      deleteChatRoom: async (chatRoomId: string) => {
        try {
          const response = await chatService.deleteChatRoom(chatRoomId);
          if (response.success) {
            set(state => {
              const isSelected = state.selectedChatRoom?._id === chatRoomId;
              return {
                chatRooms: state.chatRooms.filter(room => room._id !== chatRoomId),
                selectedChatRoom: isSelected ? null : state.selectedChatRoom,
                messages: isSelected ? [] : state.messages,
              };
            });
            toast.success('Chat deleted successfully');
            return true;
          } else {
            toast.error('Failed to delete chat');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete chat');
          return false;
        }
      },

      fetchAndSelectChatRoomById: async (chatRoomId: string) => {
        try {
          const response = await chatService.getChatRoom(chatRoomId);
          if (response.success) {
            const chatRoom = response.data.chatRoom;
            set(state => {
              // Add to chatRooms if not present
              const exists = state.chatRooms.some(room => room._id === chatRoomId);
              return {
                chatRooms: exists ? state.chatRooms : [chatRoom, ...state.chatRooms],
                selectedChatRoom: chatRoom,
                messages: response.data.messages,
              };
            });
            // Join the chat room for real-time updates
            get().joinChatRoom(chatRoomId);
          } else {
            toast.error('Chat room not found');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to fetch chat room');
        }
      },

      // Messages actions
      fetchMessages: async (chatRoomId: string) => {
        set({ messagesLoading: true, messagesError: null });

        try {
          const response = await chatService.getChatRoom(chatRoomId);

          if (response.success) {
            set({
              messages: response.data.messages,
              messagesLoading: false,
            });
          } else {
            set({
              messagesError: 'Failed to fetch messages',
              messagesLoading: false,
            });
          }
        } catch (error: any) {
          set({
            messagesError: error.message || 'Failed to fetch messages',
            messagesLoading: false,
          });
        }
      },

      sendMessage: async (chatRoomId: string, messageData: SendMessageData) => {
        try {
          const response = await chatService.sendMessage(chatRoomId, messageData);

          if (response.success) {
            const newMessage = response.data.message;
            set(state => ({
              messages: [...state.messages, newMessage]
            }));

            // Update chat room's last message
            set(state => ({
              chatRooms: state.chatRooms.map(room => 
                room._id === chatRoomId 
                  ? { 
                      ...room, 
                      lastMessage: {
                        content: newMessage.content,
                        senderId: newMessage.senderId,
                        timestamp: newMessage.createdAt
                      }
                    }
                  : room
              )
            }));

            return true;
          } else {
            toast.error('Failed to send message');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to send message');
          return false;
        }
      },

      deleteMessage: async (messageId: string) => {
        try {
          const response = await chatService.deleteMessage(messageId);

          if (response.success) {
            set(state => ({
              messages: state.messages.filter(msg => msg._id !== messageId)
            }));
            
            toast.success('Message deleted');
            return true;
          } else {
            toast.error('Failed to delete message');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete message');
          return false;
        }
      },

      markMessagesAsRead: async (chatRoomId: string) => {
        try {
          await chatService.markMessagesAsRead(chatRoomId);
          
          // Update unread count in chat rooms
          set(state => ({
            chatRooms: state.chatRooms.map(room => 
              room._id === chatRoomId 
                ? { ...room, unreadCount: 0 }
                : room
            )
          }));
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      },

      uploadFileToChat: async (chatRoomId: string, file: File) => {
        try {
          const response = await chatService.uploadFileToChat(chatRoomId, file);
          if (response.success) {
            const newMessage = response.data.message;
            set(state => ({
              messages: [...state.messages, newMessage]
            }));
            // Optionally update chatRooms' lastMessage
            set(state => ({
              chatRooms: state.chatRooms.map(room =>
                room._id === chatRoomId
                  ? {
                      ...room,
                      lastMessage: {
                        content: newMessage.content,
                        senderId: newMessage.senderId,
                        timestamp: newMessage.createdAt
                      }
                    }
                  : room
              )
            }));
            return true;
          } else {
            toast.error('Failed to upload file');
            return false;
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload file');
          return false;
        }
      },

      // Real-time actions
      addMessage: (message: Message) => {
        const { selectedChatRoom } = get();
        
        // Only add message if it's for the current chat room
        if (selectedChatRoom && message.chatRoomId === selectedChatRoom._id) {
          set(state => ({
            messages: [...state.messages, message]
          }));
        }

        // Update chat room's last message
        set(state => ({
          chatRooms: state.chatRooms.map(room => 
            room._id === message.chatRoomId 
              ? { 
                  ...room, 
                  lastMessage: {
                    content: message.content,
                    senderId: message.senderId,
                    timestamp: message.createdAt
                  },
                  unreadCount: room.unreadCount + 1
                }
              : room
          )
        }));
      },

      removeMessage: (messageId: string) => {
        set(state => ({
          messages: state.messages.filter(msg => msg._id !== messageId)
        }));
      },

      setTypingUser: (userId: string, isTyping: boolean) => {
        set(state => {
          const newTypingUsers = new Set(state.typingUsers);
          if (isTyping) {
            newTypingUsers.add(userId);
          } else {
            newTypingUsers.delete(userId);
          }
          return { typingUsers: newTypingUsers };
        });
      },

      setUserOnline: (userId: string, isOnline: boolean) => {
        set(state => {
          const newOnlineUsers = new Set(state.onlineUsers);
          if (isOnline) {
            newOnlineUsers.add(userId);
          } else {
            newOnlineUsers.delete(userId);
          }
          return { onlineUsers: newOnlineUsers };
        });
      },

      updateUnreadCount: (count: number) => {
        set({ unreadCount: count });
      },

      // Socket management
      initializeSocket: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          await chatService.initializeSocket(token);
          
          // Set up event listeners after socket is initialized
          chatService.joinUserRoom(user.id);

          chatService.onNewMessage((data) => {
            get().addMessage(data.message);
          });

          chatService.onMessageDeleted((data) => {
            get().removeMessage(data.messageId);
          });

          chatService.onUserTyping((data) => {
            get().setTypingUser(data.userId, true);
          });

          chatService.onUserStoppedTyping((data) => {
            get().setTypingUser(data.userId, false);
          });

          chatService.onUserStatusChange((data) => {
            get().setUserOnline(data.userId, data.status === 'online');
          });
        } catch (error) {
          console.error('Failed to initialize chat socket:', error);
        }
      },

      disconnectSocket: () => {
        chatService.disconnect();
        set({
          typingUsers: new Set(),
          onlineUsers: new Set()
        });
      },

      joinChatRoom: (chatRoomId: string) => {
        chatService.joinChatRoom(chatRoomId);
      },

      leaveChatRoom: (chatRoomId: string) => {
        chatService.leaveChatRoom(chatRoomId);
      },

      setupTypingIndicator: (chatRoomId: string, userId: string, userName: string) => {
        chatService.setupTypingIndicator(chatRoomId, userId, userName);
      },

      // Utility actions
      clearErrors: () => {
        set({
          chatRoomsError: null,
          messagesError: null
        });
      },

      reset: () => {
        set({
          chatRooms: [],
          selectedChatRoom: null,
          messages: [],
          typingUsers: new Set(),
          onlineUsers: new Set(),
          unreadCount: 0,
          chatRoomsLoading: false,
          chatRoomsError: null,
          messagesLoading: false,
          messagesError: null
        });
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chatRooms: state.chatRooms,
        unreadCount: state.unreadCount
      })
    }
  )
); 