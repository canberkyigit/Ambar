import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  username?: string;
  postId?: string;
  timestamp: number;
  read: boolean;
}

function generateMockNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    { id: 'n1', type: 'like', title: 'New like', body: 'cocktail_lover liked your post', username: 'cocktail_lover', postId: 'post_1', timestamp: now - 3600000, read: false },
    { id: 'n2', type: 'comment', title: 'New comment', body: 'mixmaster_jane: "Looks amazing!"', username: 'mixmaster_jane', postId: 'post_1', timestamp: now - 7200000, read: false },
    { id: 'n3', type: 'follow', title: 'New follower', body: 'shaker_pro started following you', username: 'shaker_pro', timestamp: now - 86400000, read: true },
  ];
}

interface NotificationsState {
  items: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: generateMockNotifications(),

      markAsRead: (id) =>
        set((state) => ({
          items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllAsRead: () =>
        set((state) => ({
          items: state.items.map((n) => ({ ...n, read: true })),
        })),

      unreadCount: () => get().items.filter((n) => !n.read).length,

      addNotification: (n) =>
        set((state) => ({
          items: [
            { ...n, id: `n_${Date.now()}`, timestamp: Date.now(), read: false },
            ...state.items,
          ],
        })),
    }),
    {
      name: 'notifications-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
