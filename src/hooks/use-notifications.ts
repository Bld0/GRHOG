'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { apiClient } from '@/lib/api-client';
import { useRolePermissions } from './use-role-permissions';

export interface Notification {
  id: number;
  type: 'BATTERY_LOW' | 'STORAGE_FULL';
  title: string;
  message: string;
  binId: string;
  binName: string;
  district?: string;
  khoroo?: number;
  level: number;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function useNotifications() {
  const { isKhorooLeader } = useRolePermissions();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const stompClient = useRef<Client | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiClient.get<NotificationPage>(
        '/api/notifications?page=0&size=20'
      );
      setNotifications(data.content);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiClient.get<{ unread: number; total: number }>(
        '/api/notifications/count'
      );
      setUnreadCount(data.unread);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await apiClient.put(`/api/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  /**
   * Устгах нь backend дээр SUPER_ADMIN-д л нээлттэй. Дарга бол зөвхөн
   * уншигч — товчийг нуухаас гадна үйлдлийг өөрийг нь ч зогсооно
   * (UI нуух нь ганцаараа хамгаалалт биш).
   */
  const deleteNotification = useCallback(async (id: number) => {
    if (isKhorooLeader) return;
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [fetchUnreadCount, isKhorooLeader]);

  // WebSocket connection
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // `/topic/notifications` нь ХҮН БҮРТ нэг ижил урсгал цацдаг — бүсээр
    // ялгадаггүй. Хорооны даргыг холбовол хөрш хорооны мэдэгдэл шууд
    // хонхонд нь орж ирж, REST талд хийсэн бүх шүүлтийг ор тас үгүй
    // болгоно. Даргад мэдэгдэл нь татаж (pull) шинэчлэгдэнэ.
    if (isKhorooLeader) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe('/topic/notifications', (message) => {
          const notification: Notification = JSON.parse(message.body);
          setNotifications((prev) => [notification, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current?.active) {
        stompClient.current.deactivate();
      }
    };
  }, [fetchNotifications, fetchUnreadCount, isKhorooLeader]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
