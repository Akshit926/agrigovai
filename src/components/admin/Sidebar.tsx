import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, ShieldAlert, Satellite, MessageSquare, BarChart3, FileBarChart, Settings, Sprout, Wheat } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/schemes", label: "Schemes", icon: Wheat },
  { to: "/fraud", label: "Fraud Detection", icon: ShieldAlert },
  { to: "/field-verification", label: "Field Verification", icon: Satellite },
  { to: "/grievances", label: "Grievances", icon: MessageSquare },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <Sprout className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-foreground">AgriGov AI</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin Console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = path === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            AI Engine Online
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">v2.4 · 5 models active</div>
        </div>
      </div>
    </aside>
  );
}
