import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, ShieldAlert, MessageSquare, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface SchemeCount { name: string; count: number }
interface CategoryCount { category: string; count: number; high: number }

function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    fraud: 0,
    incomplete: 0,
    grievOpen: 0,
    grievHigh: 0,
  });
  const [schemeDemand, setSchemeDemand] = useState<SchemeCount[]>([]);
  const [grievCats, setGrievCats] = useState<CategoryCount[]>([]);
  const [recent, setRecent] = useState<{ id: string; status: string; crop: string; created_at: string; scheme: { name: string } | null; profile: { full_name: string | null } | null }[]>([]);

  useEffect(() => {
    (async () => {
      const [apps, griev] = await Promise.all([
        supabase.from("applications").select("id, status, scheme:schemes(name), priority_score, created_at, crop, profile:profiles!applications_farmer_id_fkey(full_name)").order("priority_score", { ascending: false }).limit(50),
        supabase.from("grievances").select("ai_category, priority, status"),
      ]);

      const appRows = (apps.data ?? []) as unknown as { status: string; scheme: { name: string } | null; profile: { full_name: string | null } | null; id: string; created_at: string; crop: string }[];
      setStats((s) => ({
        ...s,
        total: appRows.length,
        pending: appRows.filter((a) => ["submitted", "under_review", "field_verified"].includes(a.status)).length,
        fraud: appRows.filter((a) => a.status === "fraud_flagged").length,
        incomplete: appRows.filter((a) => a.status === "docs_incomplete").length,
      }));

      const demand: Record<string, number> = {};
      appRows.forEach((a) => {
        const n = a.scheme?.name ?? "Unknown";
        demand[n] = (demand[n] ?? 0) + 1;
      });
      setSchemeDemand(Object.entries(demand).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      setRecent(appRows.slice(0, 6));

      const grievRows = (griev.data ?? []) as { ai_category: string | null; priority: string; status: string }[];
      setStats((s) => ({
        ...s,
        grievOpen: grievRows.filter((g) => g.status === "open").length,
        grievHigh: grievRows.filter((g) => g.priority === "high" && g.status !== "closed").length,
      }));
      const cats: Record<string, { count: number; high: number }> = {};
      grievRows.forEach((g) => {
        const c = g.ai_category ?? "General";
        if (!cats[c]) cats[c] = { count: 0, high: 0 };
        cats[c].count++;
        if (g.priority === "high") cats[c].high++;
      });
      setGrievCats(Object.entries(cats).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.count - a.count));
    })();
  }, []);

  const maxDemand = Math.max(...schemeDemand.map((s) => s.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Officer Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live view of scheme applications and farmer grievances across your district.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<FileText className="h-4 w-4" />} value={stats.total} label="Total applications" tone="primary" />
        <Kpi icon={<Clock className="h-4 w-4" />} value={stats.pending + stats.incomplete} label="Awaiting action" tone="warn" />
        <Kpi icon={<ShieldAlert className="h-4 w-4" />} value={stats.fraud} label="Fraud flags" tone="danger" />
        <Kpi icon={<MessageSquare className="h-4 w-4" />} value={stats.grievOpen} label="Open grievances" tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Priority queue</h2>
            <Link to="/admin/applications" className="text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {a.profile?.full_name ?? "Farmer"} · {a.scheme?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.crop} · {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Scheme demand</h2>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          {schemeDemand.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {schemeDemand.slice(0, 6).map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{s.name}</span>
                    <span className="font-medium text-muted-foreground">{s.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(s.count / maxDemand) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Grievance categories</h2>
          <Link to="/admin/grievances" className="text-sm font-medium text-primary hover:underline">
            Open inbox <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        {grievCats.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No grievances yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grievCats.map((c) => (
              <div key={c.category} className="rounded-lg border border-border bg-background p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.category}</div>
                <div className="mt-1 flex items-end justify-between">
                  <div className="text-2xl font-bold text-foreground">{c.count}</div>
                  {c.high > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {c.high} high
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "primary" | "warn" | "danger" | "info" }) {
  const map = {
    primary: "bg-primary-soft text-primary",
    warn: "bg-warning/15 text-warning",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${map[tone]}`}>{icon}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-info/10 text-info",
    docs_incomplete: "bg-warning/15 text-warning",
    fraud_flagged: "bg-destructive/10 text-destructive",
    under_review: "bg-info/10 text-info",
    field_verified: "bg-success/10 text-success",
    approved: "bg-success/15 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
