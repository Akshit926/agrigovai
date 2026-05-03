import { useNavigate } from "@tanstack/react-router";
import { Bell, Search, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search applications, farmers, schemes…" className="pl-9" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="hidden text-xs leading-tight sm:block">
            <div className="font-semibold text-foreground">Officer</div>
            <div className="text-[10px] text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
