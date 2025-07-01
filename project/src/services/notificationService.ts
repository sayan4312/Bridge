import { API_ENDPOINTS, httpClient } from '../config/api';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: {
    notifications: Notification[];
  };
}

export interface NotificationStats {
  overview: {
    total: number;
    unread: number;
    high: number;
    urgent: number;
  };
  byType: Array<{
    _id: string;
    count: number;
    unread: number;
  }>;
}

class NotificationService {
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_ENDPOINTS.NOTIFICATIONS.BASE}?${queryParams.toString()}`;
    return await httpClient.get(url);
  }

  async getNotification(id: string): Promise<{ success: boolean; data: { notification: Notification } }> {
    return await httpClient.get(API_ENDPOINTS.NOTIFICATIONS.SINGLE(id));
  }

  async markAsRead(id: string): Promise<{ success: boolean; data: { notification: Notification } }> {
    return await httpClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  }

  async markAllAsRead(): Promise<{ success: boolean; message: string; data: { modifiedCount: number } }> {
    return await httpClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }

  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    return await httpClient.delete(API_ENDPOINTS.NOTIFICATIONS.SINGLE(id));
  }

  async clearReadNotifications(): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> {
    return await httpClient.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR_READ);
  }

  async getNotificationStats(): Promise<{ success: boolean; data: NotificationStats }> {
    return await httpClient.get(API_ENDPOINTS.NOTIFICATIONS.STATS);
  }

  // Helper method to get notification icon
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'INVESTMENT_PROPOSAL_RECEIVED': '💰',
      'INVESTMENT_PROPOSAL_ACCEPTED': '✅',
      'INVESTMENT_PROPOSAL_REJECTED': '❌',
      'BUSINESS_IDEA_LIKED': '❤️',
      'BUSINESS_IDEA_COMMENTED': '💬',
      'LOAN_APPLICATION_RECEIVED': '🏦',
      'CONSULTATION_REQUEST': '🎯',
      'CONSULTATION_RESPONSE': '💡',
      'NEW_BUSINESS_IDEA': '🚀',
      'SYSTEM_ANNOUNCEMENT': '📢',
      'PROFILE_UPDATE': '👤',
      'PASSWORD_CHANGED': '🔒',
      'LOGIN_ALERT': '⚠️',
    };
    
    return icons[type] || '📝';
  }

  // Helper method to get priority color
  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'urgent': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return colors[priority] || colors['medium'];
  }

  // Helper method to format relative time
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const notificationService = new NotificationService();