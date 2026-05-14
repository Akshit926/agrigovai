import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

interface AppRow { id: string; status: string; crop: string; area_acres: number; land_id: string; priority_score: number; created_at: string; scheme: { name: string; category: string } | null; profile: { full_name: string | null; village: string | null; district: string | null } | null }
interface GrievRow { id: string; subject: string; ai_category: string | null; priority: string; status: string; created_at: string; profile: { full_name: string | null; village: string | null } | null }

function downloadCSV(name: string, rows: Record<string, string | number>[]) {
  if (!rows.length) { toast.error("Nothing to export"); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success("Report exported");
}

function ReportsPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [griev, setGriev] = useState<GrievRow[]>([]);

  useEffect(() => {
    (async () => {
      const [a, g] = await Promise.all([
        supabase.from("applications").select("id, status, crop, area_acres, land_id, priority_score, created_at, scheme:schemes(name, category), profile:profiles(full_name, village, district)"),
        supabase.from("grievances").select("id, subject, ai_category, priority, status, created_at, profile:profiles(full_name, village)"),
      ]);
      setApps((a.data ?? []) as unknown as AppRow[]);
      setGriev((g.data ?? []) as unknown as GrievRow[]);
    })();
  }, []);

  const stats = useMemo(() => ({
    apps: apps.length,
    approved: apps.filter((x) => x.status === "approved").length,
    fraud: apps.filter((x) => x.status === "fraud_flagged").length,
    rejected: apps.filter((x) => x.status === "rejected").length,
    griev: griev.length,
    resolved: griev.filter((x) => x.status === "resolved").length,
    high: griev.filter((x) => x.priority === "high").length,
  }), [apps, griev]);

  const exportApps = () => downloadCSV("agrigov-applications", apps.map((r) => ({
    id: r.id, farmer: r.profile?.full_name ?? "", village: r.profile?.village ?? "", district: r.profile?.district ?? "",
    scheme: r.scheme?.name ?? "", crop: r.crop, area_acres: r.area_acres, land_id: r.land_id,
    priority: r.priority_score, status: r.status, created: r.created_at,
  })));
  const exportGriev = () => downloadCSV("agrigov-grievances", griev.map((r) => ({
    id: r.id, subject: r.subject, category: r.ai_category ?? "General", priority: r.priority,
    status: r.status, farmer: r.profile?.full_name ?? "", village: r.profile?.village ?? "", created: r.created_at,
  })));

  // District performance
  const byDistrict: Record<string, { total: number; approved: number; rejected: number }> = {};
  apps.forEach((a) => {
    const d = a.profile?.district ?? "—";
    byDistrict[d] = byDistrict[d] ?? { total: 0, approved: 0, rejected: 0 };
    byDistrict[d].total++;
    if (a.status === "approved") byDistrict[d].approved++;
    if (a.status === "rejected") byDistrict[d].rejected++;
  });
  const districtRows = Object.entries(byDistrict).sort((a, b) => b[1].total - a[1].total);

  // Scheme disbursement
  const bySch: Record<string, number> = {};
  apps.filter((a) => a.status === "approved").forEach((a) => {
    const s = a.scheme?.name ?? "—"; bySch[s] = (bySch[s] ?? 0) + 1;
  });
  const schemeRows = Object.entries(bySch).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate, view and export administrative reports.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      {/* Print header (only on print) */}
      <div className="hidden border-b border-border pb-4 print:block">
        <div className="text-2xl font-bold">AgriGov AI · Administrative Report</div>
        <div className="text-sm text-muted-foreground">
          Government of India · Department of Agriculture & Farmers Welfare<br />
          Generated {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Applications" value={stats.apps} sub={`${stats.approved} approved`} />
        <Tile label="Approval Rate" value={`${Math.round(stats.approved / Math.max(stats.apps, 1) * 100)}%`} sub={`${stats.rejected} rejected`} />
        <Tile label="Fraud Flagged" value={stats.fraud} sub={`${Math.round(stats.fraud / Math.max(stats.apps, 1) * 100)}% of total`} />
        <Tile label="Grievances" value={stats.griev} sub={`${stats.resolved} resolved · ${stats.high} high`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Applications Summary" action={
          <Button size="sm" onClick={exportApps} className="gap-1.5 print:hidden"><Download className="h-3.5 w-3.5" /> CSV</Button>
        }>
          <div className="space-y-2 text-sm">
            <Row label="Total submitted" value={stats.apps} />
            <Row label="Approved" value={stats.approved} />
            <Row label="Rejected" value={stats.rejected} />
            <Row label="Fraud flagged" value={stats.fraud} />
            <Row label="Approval rate" value={`${Math.round(stats.approved / Math.max(stats.apps, 1) * 100)}%`} />
          </div>
        </Card>

        <Card title="Grievance Summary" action={
          <Button size="sm" onClick={exportGriev} className="gap-1.5 print:hidden"><Download className="h-3.5 w-3.5" /> CSV</Button>
        }>
          <div className="space-y-2 text-sm">
            <Row label="Total filed" value={stats.griev} />
            <Row label="Resolved" value={stats.resolved} />
            <Row label="High priority" value={stats.high} />
            <Row label="Resolution rate" value={`${Math.round(stats.resolved / Math.max(stats.griev, 1) * 100)}%`} />
          </div>
        </Card>
      </div>

      <Card title={`District Performance (${districtRows.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2">District</th><th className="pb-2">Total</th><th className="pb-2">Approved</th><th className="pb-2">Rejected</th><th className="pb-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {districtRows.map(([d, s]) => (
                <tr key={d} className="border-b border-border/50 last:border-0">
                  <td className="py-2 font-medium text-foreground">{d}</td>
                  <td className="py-2">{s.total}</td>
                  <td className="py-2 text-success">{s.approved}</td>
                  <td className="py-2 text-destructive">{s.rejected}</td>
                  <td className="py-2">{Math.round(s.approved / Math.max(s.total, 1) * 100)}%</td>
                </tr>
              ))}
              {districtRows.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`Scheme-wise Disbursement (${schemeRows.length})`}>
        <ul className="space-y-2">
          {schemeRows.map(([s, c]) => {
            const pct = Math.round((c / Math.max(stats.approved, 1)) * 100);
            return (
              <li key={s}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{s}</span>
                  <span className="text-muted-foreground">{c} approved · {pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
          {schemeRows.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No approved applications yet</li>}
        </ul>
      </Card>

      <Card title="Quick Reports">
        <ul className="grid gap-2 sm:grid-cols-2">
          <ReportItem icon={FileBarChart} label="Monthly District Performance" onClick={() => window.print()} />
          <ReportItem icon={FileSpreadsheet} label="Scheme-wise Disbursement" onClick={exportApps} />
          <ReportItem icon={FileText} label="Fraud Investigation Log" onClick={() =>
            downloadCSV("agrigov-fraud-log", apps.filter((a) => a.status === "fraud_flagged").map((r) => ({
              id: r.id, farmer: r.profile?.full_name ?? "", village: r.profile?.village ?? "",
              scheme: r.scheme?.name ?? "", land_id: r.land_id, area: r.area_acres, created: r.created_at,
            })))
          } />
          <ReportItem icon={FileBarChart} label="Grievance Resolution SLA" onClick={exportGriev} />
        </ul>
      </Card>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ReportItem({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <Button size="sm" variant="ghost" onClick={onClick} className="print:hidden"><Download className="h-3.5 w-3.5" /></Button>
    </li>
  );
}
