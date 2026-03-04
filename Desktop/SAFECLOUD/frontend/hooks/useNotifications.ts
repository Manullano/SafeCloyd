import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/stores/auth';

export interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  related_entity?: string;
  related_id?: string;
  action_url?: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  isConnected: boolean;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user, access_token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const notificationStoreRef = useRef<Map<string, Notification>>(new Map());
  const listenersRef = useRef<Set<(notifications: Notification[]) => void>>(new Set());

  // Subscribe to notifications
  const subscribe = useCallback((callback: (notifications: Notification[]) => void) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  // Notify all listeners
  const notifyListeners = useCallback(() => {
    const notifications = Array.from(notificationStoreRef.current.values());
    listenersRef.current.forEach((listener) => listener(notifications));
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (!user || !access_token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/notifications/?token=${access_token}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected for notifications');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const notification: Notification = {
            id: data.id || `notif_${Date.now()}`,
            type: data.type || 'INFO',
            title: data.title || 'Nueva notificación',
            message: data.message || '',
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
            related_entity: data.related_entity,
            related_id: data.related_id,
            action_url: data.action_url,
          };

          notificationStoreRef.current.set(notification.id, notification);
          notifyListeners();
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
      };

      wsRef.current = ws;

      return () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [user, access_token, notifyListeners]);

  const markAsRead = useCallback((notificationId: string) => {
    const notif = notificationStoreRef.current.get(notificationId);
    if (notif) {
      notif.read = true;
      notificationStoreRef.current.set(notificationId, notif);
      notifyListeners();
    }
  }, [notifyListeners]);

  const markAllAsRead = useCallback(() => {
    notificationStoreRef.current.forEach((notif) => {
      notif.read = true;
    });
    notifyListeners();
  }, [notifyListeners]);

  const deleteNotification = useCallback((notificationId: string) => {
    notificationStoreRef.current.delete(notificationId);
    notifyListeners();
  }, [notifyListeners]);

  const notifications = Array.from(notificationStoreRef.current.values());
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
