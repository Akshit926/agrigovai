import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";

export const Route = createFileRoute("/_app/fraud")({
  component: FraudPage,
});

interface Row {
  id: string; status: string; crop: string; area_acres: number; land_id: string;
  priority_score: number; created_at: string;
  ai_fraud: { flagged?: boolean; reasons?: string[]; riskScore?: number } | null;
  scheme: { name: string } | null;
  profile: { full_name: string | null; village: string | null; district: string | null } | null;
}

function FraudPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, scheme:schemes(name), profile:profiles!inner(full_name, village, district)")
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, []);

  const flagged = rows.filter((r) => r.ai_fraud?.flagged);
  const high = flagged.filter((r) => (r.ai_fraud?.riskScore ?? 0) >= 75).length;
  const medium = flagged.filter((r) => (r.ai_fraud?.riskScore ?? 0) >= 50 && (r.ai_fraud?.riskScore ?? 0) < 75).length;

  // duplicate land detection
  const landMap: Record<string, number> = {};
  rows.forEach((r) => { landMap[r.land_id] = (landMap[r.land_id] ?? 0) + 1; });
  const duplicates = Object.values(landMap).filter((c) => c > 1).length;

  // bucket by risk band
  const buckets = [
    { band: "0-20", count: rows.filter((r) => (r.ai_fraud?.riskScore ?? 0) < 20).length },
    { band: "20-40", count: rows.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 20 && s < 40; }).length },
    { band: "40-60", count: rows.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 40 && s < 60; }).length },
    { band: "60-80", count: rows.filter((r) => { const s = r.ai_fraud?.riskScore ?? 0; return s >= 60 && s < 80; }).length },
    { band: "80+", count: rows.filter((r) => (r.ai_fraud?.riskScore ?? 0) >= 80).length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fraud & Duplicate Detection</h1>
        <p className="mt-1 text-sm text-muted-foreground">ML classifier flags suspicious patterns: duplicate land, oversize claims, repeat farmers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ShieldAlert} value={flagged.length} label="Total Fraud Alerts" tone="danger" />
        <Stat icon={AlertTriangle} value={high} label="High Risk (≥75)" tone="danger" />
        <Stat icon={TrendingUp} value={medium} label="Medium Risk" tone="warn" />
        <Stat icon={Users} value={duplicates} label="Duplicate Land IDs" tone="info" />
      </div>

      <Card title="Risk Score Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="band" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Bar dataKey="count" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title={`Suspicious Applications (${flagged.length})`}>
        {flagged.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No suspicious activity detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Farmer</th><th className="pb-2">Scheme</th><th className="pb-2">Land</th>
                  <th className="pb-2">Risk</th><th className="pb-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((r) => {
                  const score = r.ai_fraud?.riskScore ?? 0;
                  const tone = score >= 75 ? "destructive" : "warning";
                  return (
                    <tr key={r.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <div className="font-medium text-foreground">{r.profile?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{r.profile?.village}, {r.profile?.district}</div>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{r.scheme?.name}</td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">{r.land_id}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
                          {score} {score >= 75 ? "HIGH" : "MED"}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{r.ai_fraud?.reasons?.[0] ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, value, label, tone }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; tone: string }) {
  const map: Record<string, string> = { danger: "bg-destructive/10 text-destructive", warn: "bg-warning/15 text-warning", info: "bg-info/10 text-info" };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[tone]}`}><Icon className="h-5 w-5" /></div>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
