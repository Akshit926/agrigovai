import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, ShieldAlert, AlertTriangle, Flame, Clock, ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

interface AppRow {
  id: string; status: string; crop: string; area_acres: number; priority_score: number;
  created_at: string; ai_fraud: { riskScore?: number; flagged?: boolean } | null;
  ai_completeness: { complete?: boolean; score?: number } | null;
  scheme: { name: string } | null;
  profile: { full_name: string | null; village: string | null } | null;
}
interface GrievRow { ai_category: string | null; priority: string; status: string; created_at: string }

function Dashboard() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [griev, setGriev] = useState<GrievRow[]>([]);

  useEffect(() => {
    (async () => {
      const [a, g] = await Promise.all([
        supabase.from("applications").select("*, scheme:schemes(name), profile:profiles!inner(full_name, village)").order("created_at", { ascending: false }),
        supabase.from("grievances").select("ai_category, priority, status, created_at"),
      ]);
      setApps((a.data ?? []) as unknown as AppRow[]);
      setGriev((g.data ?? []) as GrievRow[]);
    })();
  }, []);

  const total = apps.length;
  const fraud = apps.filter((a) => a.status === "fraud_flagged").length;
  const incomplete = apps.filter((a) => a.status === "docs_incomplete").length;
  const highPriority = apps.filter((a) => a.priority_score >= 60).length;
  const delays = apps.filter((a) => {
    const days = (Date.now() - new Date(a.created_at).getTime()) / 86400000;
    return days > 14 && !["approved", "rejected"].includes(a.status);
  }).length;

  const kpis = [
    { label: "Total Applications", value: total, icon: FileText, tone: "primary", trend: "+12%" },
    { label: "Fraud Alerts", value: fraud, icon: ShieldAlert, tone: "danger", trend: "+3 today" },
    { label: "Missing Docs", value: incomplete, icon: AlertTriangle, tone: "warn", trend: `${Math.round(incomplete/Math.max(total,1)*100)}%` },
    { label: "High Priority", value: highPriority, icon: Flame, tone: "accent", trend: "Score ≥60" },
    { label: "Delay Risks", value: delays, icon: Clock, tone: "info", trend: ">14d open" },
  ];

  // Trend by day
  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    byDay[d.toISOString().slice(5, 10)] = 0;
  }
  apps.forEach((a) => {
    const k = a.created_at.slice(5, 10);
    if (k in byDay) byDay[k]++;
  });
  const trend = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  // Scheme demand
  const demand: Record<string, number> = {};
  apps.forEach((a) => { const n = a.scheme?.name ?? "—"; demand[n] = (demand[n] ?? 0) + 1; });
  const demandData = Object.entries(demand).map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 16) + "…" : name, value })).sort((a, b) => b.value - a.value);

  // Grievance pie
  const cats: Record<string, number> = {};
  griev.forEach((g) => { const c = g.ai_category ?? "General"; cats[c] = (cats[c] ?? 0) + 1; });
  const pieData = Object.entries(cats).map(([name, value]) => ({ name, value }));
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)", "var(--accent)"];

  const recentAlerts = apps
    .filter((a) => a.ai_fraud?.flagged || a.status === "docs_incomplete")
    .slice(0, 5);

  const pending = apps.filter((a) => ["submitted", "under_review", "field_verified"].includes(a.status)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Officer Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time view of applications, fraud signals & grievances across your district.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-success">
          <Activity className="h-3.5 w-3.5" /> AI engine processing live
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Kpi {...k} />
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Application Trend (14 days)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Grievance Categories">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Scheme Demand" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent AI Alerts" action={<Link to="/fraud" className="text-xs font-medium text-primary hover:underline">View all <ArrowRight className="inline h-3 w-3" /></Link>}>
          <div className="space-y-2.5">
            {recentAlerts.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No alerts.</div>}
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md ${a.ai_fraud?.flagged ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
                  {a.ai_fraud?.flagged ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-foreground">{a.profile?.full_name ?? "Farmer"} · {a.scheme?.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{a.ai_fraud?.flagged ? `Risk score ${a.ai_fraud.riskScore}` : "Documents missing"}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Pending Applications" action={<Link to="/applications" className="text-xs font-medium text-primary hover:underline">Open queue <ArrowRight className="inline h-3 w-3" /></Link>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">Farmer</th>
                <th className="pb-2 font-medium">Scheme</th>
                <th className="pb-2 font-medium">Crop</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 font-medium text-foreground">{a.profile?.full_name}</td>
                  <td className="py-2.5 text-muted-foreground">{a.scheme?.name}</td>
                  <td className="py-2.5 text-muted-foreground">{a.crop}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${a.priority_score}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{a.priority_score}</span>
                    </div>
                  </td>
                  <td className="py-2.5"><StatusPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {pending.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No pending applications.</div>}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone, trend }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: string; trend: string }) {
  const map: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    danger: "bg-destructive/10 text-destructive",
    warn: "bg-warning/15 text-warning",
    accent: "bg-accent-soft text-accent",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <CheckCircle2 className="h-4 w-4 text-success/60" />
      </div>
      <div className="mt-4 text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-[10px] font-medium text-muted-foreground">{trend}</div>
      </div>
    </div>
  );
}

export function Card({ title, children, action, className = "" }: { title: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
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
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
