import { Link, useNavigate } from "@tanstack/react-router";
import { Sprout, LogOut, LayoutDashboard, FileText, MessageSquare, Home } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-foreground">AgriGov AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Govt. of India · Agriculture
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {!user && (
            <>
              <Link to="/" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link to="/auth" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
            </>
          )}
          {user && role === "farmer" && (
            <>
              <NavLink to="/farmer" icon={<Home className="h-4 w-4" />}>Dashboard</NavLink>
              <NavLink to="/farmer/apply" icon={<FileText className="h-4 w-4" />}>Apply</NavLink>
              <NavLink to="/farmer/grievance" icon={<MessageSquare className="h-4 w-4" />}>Grievance</NavLink>
            </>
          )}
          {user && role === "admin" && (
            <>
              <NavLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
              <NavLink to="/admin/applications" icon={<FileText className="h-4 w-4" />}>Applications</NavLink>
              <NavLink to="/admin/grievances" icon={<MessageSquare className="h-4 w-4" />}>Grievances</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {role === "admin" ? "Officer" : "Farmer"} · {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-primary-soft text-primary" }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
