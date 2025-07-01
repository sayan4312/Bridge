import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService, Notification, NotificationFilters, NotificationStats } from '../services/notificationService';
import { logAction } from '../utils/logger';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore'; // Add this import at the top

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchNotificationStats: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  clearError: () => void;
  
  // Real-time polling
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let socket: Socket | null = null;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      stats: null,
      isLoading: false,
      error: null,

      fetchNotifications: async (filters?: NotificationFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await notificationService.getNotifications(filters);
          
          if (response.success) {
            set({ 
              notifications: response.data.notifications,
              unreadCount: response.unreadCount,
              isLoading: false 
            });
          } else {
            set({ 
              error: 'Failed to fetch notifications',
              isLoading: false 
            });
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch notifications',
            isLoading: false 
          });
        }
      },

      fetchNotificationStats: async () => {
        try {
          const response = await notificationService.getNotificationStats();
          
          if (response.success) {
            set({ stats: response.data });
          }
        } catch (error: any) {
          console.error('Failed to fetch notification stats:', error);
        }
      },

      markAsRead: async (id: string) => {
        try {
          const response = await notificationService.markAsRead(id);
          
          if (response.success) {
            set((state) => ({
              notifications: state.notifications.map(notification =>
                notification._id === id 
                  ? { ...notification, isRead: true }
                  : notification
              ),
              unreadCount: Math.max(0, state.unreadCount - 1)
            }));
            
            logAction('NOTIFICATION_READ', { notificationId: id });
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to mark notification as read');
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await notificationService.markAllAsRead();
          
          if (response.success) {
            set((state) => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                isRead: true
              })),
              unreadCount: 0
            }));
            
            logAction('ALL_NOTIFICATIONS_READ', { count: response.data.modifiedCount });
            toast.success('All notifications marked as read');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to mark all notifications as read');
        }
      },

      deleteNotification: async (id: string) => {
        try {
          const response = await notificationService.deleteNotification(id);
          
          if (response.success) {
            set((state) => {
              const notification = state.notifications.find(n => n._id === id);
              const wasUnread = notification && !notification.isRead;
              
              return {
                notifications: state.notifications.filter(n => n._id !== id),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
              };
            });
            
            logAction('NOTIFICATION_DELETED', { notificationId: id });
            toast.success('Notification deleted');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete notification');
        }
      },

      clearReadNotifications: async () => {
        try {
          const response = await notificationService.clearReadNotifications();
          
          if (response.success) {
            set((state) => ({
              notifications: state.notifications.filter(n => !n.isRead)
            }));
            
            logAction('READ_NOTIFICATIONS_CLEARED', { count: response.data.deletedCount });
            toast.success(`${response.data.deletedCount} read notifications cleared`);
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to clear read notifications');
        }
      },

      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
        
        // Show toast for high priority notifications
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          toast(notification.title, {
            icon: notificationService.getNotificationIcon(notification.type),
            duration: 5000,
          });
        }
      },

      updateNotification: (id: string, updates: Partial<Notification>) => {
        set((state) => ({
          notifications: state.notifications.map(notification =>
            notification._id === id 
              ? { ...notification, ...updates }
              : notification
          )
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      startPolling: () => {
        const { fetchNotifications } = get();

        // Stop existing polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        // Start new polling every 30 seconds
        pollingInterval = setInterval(() => {
          fetchNotifications({ limit: 50 });
        }, 30000);

        // --- WebSocket connection ---
        if (!socket) {
          socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket'],
          });

          socket.on('connect', () => {
            const userId = useAuthStore.getState().user?.id;
            if (userId) {
              if (socket) {
                socket.emit('join', { userId });
              }
            }
          });

          socket.on('notification', (notification) => {
            set((state) => ({
              notifications: [notification, ...state.notifications],
              unreadCount: state.unreadCount + 1,
            }));

            // Show toast for high/urgent notifications
            if (notification.priority === 'high' || notification.priority === 'urgent') {
              toast(notification.title, {
                icon: notificationService.getNotificationIcon(notification.type),
                duration: 5000,
              });
            }
          });
        }
      },

      stopPolling: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        // Don't persist notifications data, only UI preferences
        unreadCount: state.unreadCount,
      }),
    }
  )
);