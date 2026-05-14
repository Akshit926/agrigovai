import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, TrendingUp, Users, Search, Filter, MapPin, FileText, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/fraud")({ component: FraudPage });

interface Row {
  id: string; status: string; crop: string; area_acres: number; land_id: string;
  priority_score: number; created_at: string;
  ai_fraud: { flagged?: boolean; reasons?: string[]; riskScore?: number } | null;
  scheme: { name: string; code: string } | null;
  profile: { full_name: string | null; village: string | null; district: string | null; phone: string | null } | null;
}

const RISK_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

function FraudPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, scheme:schemes(name, code), profile:profiles!inner(full_name, village, district, phone)")
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, []);

  const flagged = rows.filter((r) => r.ai_fraud?.flagged);
  const high = flagged.filter((r) => (r.ai_fraud?.riskScore ?? 0) >= 75);
  const medium = flagged.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 50 && s < 75; });
  const low = flagged.filter((r) => (r.ai_fraud?.riskScore ?? 0) < 50);

  const landMap: Record<string, number> = {};
  rows.forEach((r) => { landMap[r.land_id] = (landMap[r.land_id] ?? 0) + 1; });
  const duplicates = Object.entries(landMap).filter(([, c]) => c > 1);

  // Risk distribution
  const buckets = [
    { band: "0-20", count: rows.filter((r) => (r.ai_fraud?.riskScore ?? 0) < 20).length },
    { band: "20-40", count: rows.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 20 && s < 40; }).length },
    { band: "40-60", count: rows.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 40 && s < 60; }).length },
    { band: "60-80", count: rows.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 60 && s < 80; }).length },
    { band: "80+", count: rows.filter((r) => (r.ai_fraud?.riskScore ?? 0) >= 80).length },
  ];

  // District-wise fraud
  const districtFraud: Record<string, { total: number; flagged: number }> = {};
  rows.forEach((r) => {
    const d = r.profile?.district || "Unknown";
    if (!districtFraud[d]) districtFraud[d] = { total: 0, flagged: 0 };
    districtFraud[d].total++;
    if (r.ai_fraud?.flagged) districtFraud[d].flagged++;
  });
  const districtChart = Object.entries(districtFraud).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.flagged - a.flagged).slice(0, 10);

  // Pie data
  const pieData = [
    { name: "High Risk", value: high.length },
    { name: "Medium Risk", value: medium.length },
    { name: "Low Risk", value: low.length },
    { name: "Clean", value: rows.length - flagged.length },
  ];

  // Monthly trend
  const monthMap: Record<string, number> = {};
  flagged.forEach((r) => { const m = r.created_at.slice(0, 7); monthMap[m] = (monthMap[m] ?? 0) + 1; });
  const trend = Object.entries(monthMap).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));

  const districts = [...new Set(rows.map(r => r.profile?.district).filter(Boolean))] as string[];

  // Filter table
  const tableRows = flagged.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.profile?.full_name?.toLowerCase().includes(s) || r.land_id.toLowerCase().includes(s);
    const score = r.ai_fraud?.riskScore ?? 0;
    const matchRisk = riskFilter === "all" || (riskFilter === "high" && score >= 75) || (riskFilter === "medium" && score >= 50 && score < 75) || (riskFilter === "low" && score < 50);
    const matchDist = districtFilter === "all" || r.profile?.district === districtFilter;
    return matchSearch && matchRisk && matchDist;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fraud & Duplicate Detection</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI/ML-powered anomaly detection: duplicate land IDs, oversized claims, repeat applications, suspicious patterns.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShieldAlert} value={flagged.length} label="Total Fraud Alerts" tone="bg-destructive/10 text-destructive" />
        <StatCard icon={AlertTriangle} value={high.length} label="High Risk (≥75)" tone="bg-destructive/10 text-destructive" />
        <StatCard icon={TrendingUp} value={medium.length} label="Medium Risk" tone="bg-warning/15 text-warning" />
        <StatCard icon={Users} value={duplicates.length} label="Duplicate Land IDs" tone="bg-info/10 text-info" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Risk Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="band" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {buckets.map((_, i) => <Cell key={i} fill={RISK_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Risk Breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Fraud Trend">
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="var(--destructive)" strokeWidth={2} dot={{ fill: "var(--destructive)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No trend data</div>}
        </Card>
      </div>

      {/* District-wise fraud */}
      <Card title="District-wise Fraud Cases">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={districtChart} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={90} stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Bar dataKey="flagged" fill="var(--destructive)" radius={[0, 6, 6, 0]} name="Flagged" />
            <Bar dataKey="total" fill="var(--primary)" radius={[0, 6, 6, 0]} name="Total" opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Suspicious Applications Table */}
      <Card title={`Suspicious Applications (${tableRows.length})`}>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search farmer or land ID..." className="pl-10" />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Risk Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="high">High (≥75)</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {tableRows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No suspicious activity matches filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Farmer</th><th className="pb-2">Scheme</th><th className="pb-2">Land ID</th>
                  <th className="pb-2">Area</th><th className="pb-2">Score</th><th className="pb-2">Risk</th>
                  <th className="pb-2">Reason</th><th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => {
                  const score = r.ai_fraud?.riskScore ?? 0;
                  const level = score >= 75 ? "HIGH" : score >= 50 ? "MED" : "LOW";
                  const toneCls = score >= 75 ? "bg-destructive/10 text-destructive" : score >= 50 ? "bg-warning/15 text-warning" : "bg-info/10 text-info";
                  return (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                      <td className="py-2.5">
                        <div className="font-medium text-foreground">{r.profile?.full_name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{r.profile?.village}, {r.profile?.district}</div>
                      </td>
                      <td className="py-2.5"><span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold">{r.scheme?.code}</span></td>
                      <td className="py-2.5 font-mono text-xs">{r.land_id}</td>
                      <td className="py-2.5 text-xs">{r.area_acres} ac</td>
                      <td className="py-2.5"><span className="font-bold text-foreground">{score}</span>/100</td>
                      <td className="py-2.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${toneCls}`}>{level}</span></td>
                      <td className="py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{r.ai_fraud?.reasons?.join(" · ") ?? "—"}</td>
                      <td className="py-2.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === "fraud_flagged" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>{r.status.replace("_", " ")}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Duplicate Land IDs */}
      {duplicates.length > 0 && (
        <Card title={`Duplicate Land IDs (${duplicates.length})`}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {duplicates.map(([land, count]) => (
              <div key={land} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div>
                  <div className="font-mono text-sm font-bold text-foreground">{land}</div>
                  <div className="text-[11px] text-muted-foreground">{rows.filter(r => r.land_id === land).map(r => r.profile?.full_name).join(", ")}</div>
                </div>
                <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-bold text-destructive">{count}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, tone }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
