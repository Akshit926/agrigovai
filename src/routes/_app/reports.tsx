import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, FileBarChart, FileText, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "./dashboard";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [stats, setStats] = useState({ apps: 0, approved: 0, fraud: 0, griev: 0, resolved: 0 });

  useEffect(() => {
    (async () => {
      const [a, g] = await Promise.all([
        supabase.from("applications").select("status"),
        supabase.from("grievances").select("status"),
      ]);
      const aData = (a.data ?? []) as { status: string }[];
      const gData = (g.data ?? []) as { status: string }[];
      setStats({
        apps: aData.length,
        approved: aData.filter((x) => x.status === "approved").length,
        fraud: aData.filter((x) => x.status === "fraud_flagged").length,
        griev: gData.length,
        resolved: gData.filter((x) => x.status === "resolved").length,
      });
    })();
  }, []);

  const exportCSV = async () => {
    const { data } = await supabase
      .from("applications")
      .select("id, status, crop, area_acres, land_id, priority_score, created_at, scheme:schemes(name), profile:profiles!inner(full_name, village, district)");
    if (!data) return;
    const rows = data as unknown as { id: string; status: string; crop: string; area_acres: number; land_id: string; priority_score: number; created_at: string; scheme: { name: string } | null; profile: { full_name: string | null; village: string | null; district: string | null } | null }[];
    const header = ["id", "farmer", "village", "district", "scheme", "crop", "area", "land", "priority", "status", "created"];
    const csv = [header.join(",")].concat(rows.map((r) => [
      r.id, r.profile?.full_name ?? "", r.profile?.village ?? "", r.profile?.district ?? "",
      r.scheme?.name ?? "", r.crop, r.area_acres, r.land_id, r.priority_score, r.status, r.created_at,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `agrigov-applications-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate and export administrative reports for review or audit.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Applications Summary">
          <div className="space-y-2 text-sm">
            <Row label="Total submitted" value={stats.apps} />
            <Row label="Approved" value={stats.approved} />
            <Row label="Fraud flagged" value={stats.fraud} />
            <Row label="Approval rate" value={`${Math.round(stats.approved / Math.max(stats.apps, 1) * 100)}%`} />
          </div>
          <Button onClick={exportCSV} className="mt-4 w-full gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
        </Card>

        <Card title="Grievance Summary">
          <div className="space-y-2 text-sm">
            <Row label="Total filed" value={stats.griev} />
            <Row label="Resolved" value={stats.resolved} />
            <Row label="Resolution rate" value={`${Math.round(stats.resolved / Math.max(stats.griev, 1) * 100)}%`} />
          </div>
          <Button variant="outline" className="mt-4 w-full gap-2" onClick={() => toast.info("PDF export coming soon")}><FileText className="h-4 w-4" /> Export PDF</Button>
        </Card>

        <Card title="Available Reports">
          <ul className="space-y-2 text-sm">
            <ReportItem icon={FileBarChart} label="Monthly District Performance" />
            <ReportItem icon={FileSpreadsheet} label="Scheme-wise Disbursement" />
            <ReportItem icon={FileText} label="Fraud Investigation Log" />
            <ReportItem icon={FileBarChart} label="Grievance Resolution SLA" />
          </ul>
        </Card>
      </div>
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

function ReportItem({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
    </li>
  );
}
