import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  icon?: string;
}

interface NotifCtx {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

const Ctx = createContext<NotifCtx>({
  notifications: [],
  unreadCount: 0,
  add: () => {},
  markRead: () => {},
  markAllRead: () => {},
  clear: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("agrigov_notifs");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: Notification & { timestamp: string }) => ({ ...n, timestamp: new Date(n.timestamp) }));
      }
    } catch {}
    return [];
  });

  const persist = useCallback((notifs: Notification[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("agrigov_notifs", JSON.stringify(notifs.slice(0, 50)));
    }
  }, []);

  const add = useCallback((n: Omit<Notification, "id" | "read" | "timestamp">) => {
    const notif: Notification = {
      ...n,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      read: false,
      timestamp: new Date(),
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 50);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clear = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, [persist]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Ctx.Provider value={{ notifications, unreadCount, add, markRead, markAllRead, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
