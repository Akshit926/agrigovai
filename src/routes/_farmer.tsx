import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2, MessageSquarePlus, History, Sprout, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_farmer")({
  component: FarmerLayout,
});

const items = [
  { to: "/farmer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/farmer/apply", label: "Apply for Scheme", icon: FilePlus2 },
  { to: "/farmer/applications", label: "My Applications", icon: History },
  { to: "/farmer/grievance", label: "File Grievance", icon: MessageSquarePlus },
];

function FarmerLayout() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role === "admin") return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* GovTech header */}
      <div className="border-b-2 border-primary bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[11px]">
          <span className="opacity-90">भारत सरकार · Government of India</span>
          <span className="opacity-90">Department of Agriculture & Farmers Welfare</span>
        </div>
      </div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/farmer" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">AgriGov AI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Farmer Portal</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary"><User className="h-3.5 w-3.5" /></div>
              <span className="text-xs font-medium">{user.email}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={async () => { await signOut(); navigate({ to: "/login" }); }}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {items.map((it) => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} AgriGov AI · Built for Indian agriculture administration
        </div>
      </footer>
    </div>
  );
}
