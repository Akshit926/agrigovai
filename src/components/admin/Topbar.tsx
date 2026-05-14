import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, LogOut, User, ShieldAlert, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Result {
  type: "application" | "grievance";
  id: string;
  title: string;
  subtitle: string;
}
interface Notif {
  type: "fraud" | "missing" | "grievance";
  id: string;
  title: string;
  meta: string;
  href: string;
}

export function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [openSearch, setOpenSearch] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [openNotif, setOpenNotif] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
      const [a, g] = await Promise.all([
        supabase
          .from("applications")
          .select("id, status, ai_fraud, scheme:schemes(name), profile:profiles!inner(full_name, village)")
          .in("status", ["fraud_flagged", "docs_incomplete"])
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("grievances")
          .select("id, subject, priority, profile:profiles!inner(full_name)")
          .eq("priority", "high")
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const list: Notif[] = [];
      ((a.data ?? []) as never as { id: string; status: string; scheme: { name: string } | null; profile: { full_name: string | null; village: string | null } | null }[]).forEach((r) => {
        list.push({
          type: r.status === "fraud_flagged" ? "fraud" : "missing",
          id: r.id,
          title: `${r.profile?.full_name ?? "Farmer"} · ${r.scheme?.name ?? ""}`,
          meta: r.status === "fraud_flagged" ? "Fraud signal" : "Documents missing",
          href: "/applications",
        });
      });
      ((g.data ?? []) as never as { id: string; subject: string; profile: { full_name: string | null } | null }[]).forEach((r) => {
        list.push({ type: "grievance", id: r.id, title: r.subject, meta: `High priority · ${r.profile?.full_name ?? ""}`, href: "/grievances" });
      });
      setNotifs(list);
  };
  useEffect(() => {
    loadNotifs();
    const ch = supabase
      .channel("topbar-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => loadNotifs())
      .on("postgres_changes", { event: "*", schema: "public", table: "grievances" }, () => loadNotifs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const term = `%${q.trim()}%`;
      const [a, g] = await Promise.all([
        supabase
          .from("applications")
          .select("id, crop, land_id, scheme:schemes(name), profile:profiles!inner(full_name, village)")
          .or(`crop.ilike.${term},land_id.ilike.${term}`)
          .limit(6),
        supabase.from("grievances").select("id, subject, ai_category").ilike("subject", term).limit(4),
      ]);
      const r: Result[] = [];
      ((a.data ?? []) as never as { id: string; crop: string; land_id: string; scheme: { name: string } | null; profile: { full_name: string | null; village: string | null } | null }[]).forEach((x) =>
        r.push({ type: "application", id: x.id, title: `${x.profile?.full_name ?? "Farmer"} · ${x.scheme?.name ?? ""}`, subtitle: `${x.crop} · Land ${x.land_id} · ${x.profile?.village ?? ""}` })
      );
      ((g.data ?? []) as { id: string; subject: string; ai_category: string | null }[]).forEach((x) =>
        r.push({ type: "grievance", id: x.id, title: x.subject, subtitle: x.ai_category ?? "Grievance" })
      );
      setResults(r);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenSearch(false); setOpenNotif(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = async () => { await signOut(); navigate({ to: "/login" }); };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6" ref={ref}>
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search applications, farmers, schemes…"
          className="pl-9"
          value={q}
          onFocus={() => setOpenSearch(true)}
          onChange={(e) => { setQ(e.target.value); setOpenSearch(true); }}
        />
        {openSearch && q && (
          <div className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-lg border border-border bg-popover shadow-[var(--shadow-elevated)]">
            {results.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">No results</div>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((r) => (
                  <li key={r.type + r.id}>
                    <Link
                      to={r.type === "application" ? "/applications" : "/grievances"}
                      onClick={() => { setOpenSearch(false); setQ(""); }}
                      className="flex items-start gap-2.5 px-3 py-2 text-sm hover:bg-secondary"
                    >
                      {r.type === "application" ? <FileText className="mt-0.5 h-4 w-4 text-primary" /> : <MessageSquare className="mt-0.5 h-4 w-4 text-accent" />}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{r.title}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <div className="relative">
          <Button size="icon" variant="ghost" className="relative" onClick={() => setOpenNotif((v) => !v)}>
            <Bell className="h-4 w-4" />
            {notifs.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {notifs.length}
              </span>
            )}
          </Button>
          {openNotif && (
            <div className="absolute right-0 top-full mt-1.5 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-[var(--shadow-elevated)]">
              <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alerts ({notifs.length})</div>
              {notifs.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">All clear.</div>
              ) : (
                <ul className="max-h-96 overflow-y-auto">
                  {notifs.map((n) => {
                    const Icon = n.type === "fraud" ? ShieldAlert : n.type === "missing" ? AlertTriangle : MessageSquare;
                    const tone = n.type === "fraud" ? "text-destructive bg-destructive/10" : n.type === "missing" ? "text-warning bg-warning/15" : "text-accent bg-accent-soft";
                    return (
                      <li key={n.id}>
                        <Link to={n.href} onClick={() => setOpenNotif(false)} className="flex items-start gap-2.5 border-b border-border px-3 py-2.5 text-sm last:border-0 hover:bg-secondary">
                          <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md ${tone}`}><Icon className="h-3.5 w-3.5" /></span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{n.title}</div>
                            <div className="text-[11px] text-muted-foreground">{n.meta}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

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
