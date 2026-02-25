import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toast: ToastMessage | null;
  show: (text: string, type?: ToastType, duration?: number) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toast: null,

  show: (text, type = 'success', duration = 2500) =>
    set({
      toast: {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text,
        type,
        duration,
      },
    }),

  hide: () => set({ toast: null }),
}));
