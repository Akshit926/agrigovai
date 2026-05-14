import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, ShieldAlert, AlertTriangle, Flame, Clock, ArrowRight, Activity, CheckCircle2, MapPin, Filter, RefreshCw, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

interface AppRow {
  id: string; farmer_id: string; status: string; crop: string; area_acres: number; priority_score: number;
  created_at: string; ai_fraud: { riskScore?: number; flagged?: boolean } | null;
  ai_completeness: { complete?: boolean; score?: number } | null;
  scheme: { name: string } | null;
  profile: { full_name: string | null; village: string | null; district: string | null; taluka: string | null } | null;
}
interface GrievRow { ai_category: string | null; priority: string; status: string; created_at: string }

function Dashboard() {
  const { t } = useI18n();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [griev, setGriev] = useState<GrievRow[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [districtFilter, setDistrictFilter] = useState("all");
  const [talukaFilter, setTalukaFilter] = useState("all");

  const load = useCallback(async () => {
    const [a, g] = await Promise.all([
      supabase.from("applications").select("*, scheme:schemes(name)").order("created_at", { ascending: false }),
      supabase.from("grievances").select("ai_category, priority, status, created_at"),
    ]);
    const rows = (a.data ?? []) as unknown as AppRow[];
    const farmerIds = [...new Set(rows.map((app) => app.farmer_id).filter(Boolean))];
    const profileMap = new Map<string, AppRow["profile"]>();
    if (farmerIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, village, district, taluka").in("id", farmerIds);
      (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));
    }
    setApps(rows.map((app) => ({ ...app, profile: profileMap.get(app.farmer_id) ?? null })));
    setGriev((g.data ?? []) as GrievRow[]);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    load();
    // Real-time subscriptions for both tables
    const ch = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "grievances" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // District/taluka lists
  const districts = [...new Set(apps.map(a => a.profile?.district).filter(Boolean))] as string[];
  const talukas = [...new Set(apps.filter(a => districtFilter === "all" || a.profile?.district === districtFilter).map(a => a.profile?.taluka).filter(Boolean))] as string[];

  // Filtered data
  const filteredApps = apps.filter(a => {
    if (districtFilter !== "all" && a.profile?.district !== districtFilter) return false;
    if (talukaFilter !== "all" && a.profile?.taluka !== talukaFilter) return false;
    return true;
  });

  const total = filteredApps.length;
  const fraud = filteredApps.filter(a => a.status === "fraud_flagged").length;
  const incomplete = filteredApps.filter(a => a.status === "docs_incomplete").length;
  const highPriority = filteredApps.filter(a => a.priority_score >= 60).length;
  const delays = filteredApps.filter(a => {
    const days = (Date.now() - new Date(a.created_at).getTime()) / 86400000;
    return days > 14 && !["approved", "rejected"].includes(a.status);
  }).length;
  const approved = filteredApps.filter(a => a.status === "approved").length;

  const kpis = [
    { label: t("admin.total_apps"), value: total, icon: FileText, tone: "primary", trend: `${approved} ${t("admin.approved")}` },
    { label: t("admin.fraud_alerts"), value: fraud, icon: ShieldAlert, tone: "danger", trend: t("admin.ai_flagged") },
    { label: t("admin.missing_docs"), value: incomplete, icon: AlertTriangle, tone: "warn", trend: `${Math.round(incomplete / Math.max(total, 1) * 100)}%` },
    { label: t("admin.high_priority"), value: highPriority, icon: Flame, tone: "accent", trend: "Score ≥60" },
    { label: t("admin.delay_risks"), value: delays, icon: Clock, tone: "info", trend: ">14d" },
  ];

  // 14-day trend
  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); byDay[d.toISOString().slice(5, 10)] = 0; }
  filteredApps.forEach(a => { const k = a.created_at.slice(5, 10); if (k in byDay) byDay[k]++; });
  const trend = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  // Scheme demand
  const demand: Record<string, number> = {};
  filteredApps.forEach(a => { const n = a.scheme?.name ?? "—"; demand[n] = (demand[n] ?? 0) + 1; });
  const demandData = Object.entries(demand).map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 16) + "…" : name, value })).sort((a, b) => b.value - a.value);

  // Grievance pie
  const cats: Record<string, number> = {};
  griev.forEach(g => { const c = g.ai_category ?? "General"; cats[c] = (cats[c] ?? 0) + 1; });
  const pieData = Object.entries(cats).map(([name, value]) => ({ name, value }));
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)", "var(--accent)"];

  // District heat map data
  const districtHeat: Record<string, { total: number; fraud: number; pending: number }> = {};
  apps.forEach(a => {
    const d = a.profile?.district || "Unknown";
    if (!districtHeat[d]) districtHeat[d] = { total: 0, fraud: 0, pending: 0 };
    districtHeat[d].total++;
    if (a.ai_fraud?.flagged) districtHeat[d].fraud++;
    if (["submitted", "under_review"].includes(a.status)) districtHeat[d].pending++;
  });
  const heatData = Object.entries(districtHeat).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 12);

  const recentAlerts = filteredApps.filter(a => a.ai_fraud?.flagged || a.status === "docs_incomplete").slice(0, 5);
  const pending = filteredApps.filter(a => ["submitted", "under_review", "field_verified"].includes(a.status)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("admin.dashboard")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.dashboard_desc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-success">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> {t("admin.live")}
          </div>
          <span className="text-[10px] text-muted-foreground">{t("admin.updated")}: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* District / Taluka Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">{t("admin.filter_by")}:</span>
        <Select value={districtFilter} onValueChange={(v) => { setDistrictFilter(v); setTalukaFilter("all"); }}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder={t("admin.district")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.all_districts")}</SelectItem>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={talukaFilter} onValueChange={setTalukaFilter}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder={t("admin.taluka")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.all_talukas")}</SelectItem>
            {talukas.map(tk => <SelectItem key={tk} value={tk}>{tk}</SelectItem>)}
          </SelectContent>
        </Select>
        {(districtFilter !== "all" || talukaFilter !== "all") && (
          <button onClick={() => { setDistrictFilter("all"); setTalukaFilter("all"); }} className="text-xs text-primary hover:underline">{t("admin.clear_filters")}</button>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{total} {t("admin.results")}</span>
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
        <Card title={t("admin.app_trend")} className="lg:col-span-2">
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
        <Card title={t("admin.griev_cats")}>
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

      {/* District Heat Map + Scheme Demand */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("admin.district_heat")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {heatData.map(d => {
              const intensity = Math.min(d.total / Math.max(...heatData.map(h => h.total), 1), 1);
              const fraudRate = d.fraud / Math.max(d.total, 1);
              return (
                <button key={d.name} onClick={() => { setDistrictFilter(d.name); setTalukaFilter("all"); }}
                  className={`rounded-lg border p-3 text-left transition hover:shadow-md ${districtFilter === d.name ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{d.name}</span>
                    <span className="text-lg font-bold text-foreground">{d.total}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${intensity * 100}%`, background: fraudRate > 0.2 ? "var(--destructive)" : fraudRate > 0.1 ? "var(--warning)" : "var(--primary)" }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    <span>{d.pending} pending</span>
                    <span className={fraudRate > 0.1 ? "text-destructive font-semibold" : ""}>{d.fraud} flagged</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={t("admin.scheme_demand")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demandData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis type="category" dataKey="name" width={120} stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alerts + Pending Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t("admin.recent_alerts")} action={<Link to="/fraud" className="text-xs font-medium text-primary hover:underline">{t("admin.view_all")} <ArrowRight className="inline h-3 w-3" /></Link>} className="lg:col-span-1">
          <div className="space-y-2.5">
            {recentAlerts.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">{t("admin.no_alerts")}</div>}
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md ${a.ai_fraud?.flagged ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
                  {a.ai_fraud?.flagged ? <ShieldAlert className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-foreground">{a.profile?.full_name ?? "Farmer"} · {a.scheme?.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{a.ai_fraud?.flagged ? `Risk ${a.ai_fraud.riskScore}` : t("admin.docs_missing")}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("admin.pending_apps")} action={<Link to="/applications" className="text-xs font-medium text-primary hover:underline">{t("admin.open_queue")} <ArrowRight className="inline h-3 w-3" /></Link>} className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">{t("admin.farmer")}</th>
                  <th className="pb-2 font-medium">{t("admin.scheme")}</th>
                  <th className="pb-2 font-medium">{t("admin.district")}</th>
                  <th className="pb-2 font-medium">{t("admin.priority")}</th>
                  <th className="pb-2 font-medium">{t("admin.status")}</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{a.profile?.full_name}</td>
                    <td className="py-2.5 text-muted-foreground">{a.scheme?.name}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{a.profile?.district}, {a.profile?.taluka}</td>
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
            {pending.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">{t("admin.no_pending")}</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone, trend }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: string; trend: string }) {
  const map: Record<string, string> = { primary: "bg-primary-soft text-primary", danger: "bg-destructive/10 text-destructive", warn: "bg-warning/15 text-warning", accent: "bg-accent-soft text-accent", info: "bg-info/10 text-info" };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[tone]}`}><Icon className="h-5 w-5" /></div>
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
    submitted: "bg-info/10 text-info", docs_incomplete: "bg-warning/15 text-warning",
    fraud_flagged: "bg-destructive/10 text-destructive", under_review: "bg-info/10 text-info",
    field_verified: "bg-success/10 text-success", approved: "bg-success/15 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status.replace("_", " ")}</span>;
}
