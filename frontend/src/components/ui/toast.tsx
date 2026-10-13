import * as React from 'react';
import { create } from 'zustand';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: number; kind: ToastKind; title: string; description?: string; exiting?: boolean }

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: number) => void;
}

let counter = 0;
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((x) => x.id === id ? { ...x, exiting: true } : x),
      }));
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, 200);
    }, 4800);
  },
  dismiss: (id) => {
    set((s) => ({
      toasts: s.toasts.map((x) => x.id === id ? { ...x, exiting: true } : x),
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 200);
  },
}));

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ kind: 'success', title, description }),
  error: (title: string, description?: string) => useToastStore.getState().push({ kind: 'error', title, description }),
  warning: (title: string, description?: string) => useToastStore.getState().push({ kind: 'warning', title, description }),
  info: (title: string, description?: string) => useToastStore.getState().push({ kind: 'info', title, description }),
};

const ICONS: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info,
};
const COLORS: Record<ToastKind, string> = {
  success: 'text-healthy', error: 'text-danger', warning: 'text-retry', info: 'text-brand',
};
const BORDER_COLORS: Record<ToastKind, string> = {
  success: 'border-healthy/20', error: 'border-danger/20', warning: 'border-retry/20', info: 'border-border',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border bg-surface-raised p-3.5 shadow-dialog',
              BORDER_COLORS[t.kind],
              t.exiting ? 'animate-toast-out' : 'animate-toast-in'
            )}
          >
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', COLORS[t.kind])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">{t.title}</p>
              {t.description && <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-text-tertiary hover:text-text transition-colors shrink-0 rounded p-0.5 hover:bg-surface-overlay"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
