import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useNotifications, type Notification } from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle,
};
const toneMap: Record<string, string> = {
  info: "bg-info/15 text-info", success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning", error: "bg-destructive/15 text-destructive",
};

export function NotificationPanel() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition hover:bg-secondary"
        aria-label={t("notif.title")}
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">{t("notif.title")}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                <CheckCheck className="h-3 w-3" /> {t("notif.mark_read")}
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">{t("notif.empty")}</div>
            ) : (
              notifications.slice(0, 15).map((n) => {
                const Icon = iconMap[n.type] || Info;
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex cursor-pointer gap-3 border-b border-border/50 px-4 py-3 transition hover:bg-secondary/50 ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneMap[n.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</span>
                        {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                      <span className="mt-1 text-[10px] text-muted-foreground">{formatTime(n.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}
