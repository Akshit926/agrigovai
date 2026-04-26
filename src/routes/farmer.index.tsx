import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, MessageSquare, ArrowRight, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/farmer/")({
  component: FarmerDashboard,
});

interface AppRow {
  id: string;
  status: string;
  crop: string;
  land_id: string;
  created_at: string;
  scheme: { name: string; code: string } | null;
  ai_completeness: { missing?: string[] } | null;
}

interface GrievanceRow {
  id: string;
  subject: string;
  ai_category: string | null;
  priority: string;
  status: string;
  created_at: string;
}

function FarmerDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [griev, setGriev] = useState<GrievanceRow[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [a, g, p] = await Promise.all([
        supabase
          .from("applications")
          .select("id, status, crop, land_id, created_at, ai_completeness, scheme:schemes(name, code)")
          .eq("farmer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("grievances")
          .select("id, subject, ai_category, priority, status, created_at")
          .eq("farmer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      if (a.data) setApps(a.data as unknown as AppRow[]);
      if (g.data) setGriev(g.data as GrievanceRow[]);
      if (p.data) setProfile(p.data);
    })();
  }, [user]);

  const counts = {
    total: apps.length,
    approved: apps.filter((a) => a.status === "approved").length,
    pending: apps.filter((a) => !["approved", "rejected"].includes(a.status)).length,
    issues: apps.filter((a) => ["docs_incomplete", "fraud_flagged", "rejected"].includes(a.status)).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Namaste{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 🌾
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your scheme applications and grievances in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/farmer/grievance">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" /> File grievance
            </Button>
          </Link>
          <Link to="/farmer/apply">
            <Button className="gap-2">
              <FileText className="h-4 w-4" /> Apply for scheme
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<FileText className="h-4 w-4 text-primary" />} value={counts.total} label="Applications" />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4 text-success" />} value={counts.approved} label="Approved" />
        <KpiCard icon={<Clock className="h-4 w-4 text-warning" />} value={counts.pending} label="In progress" />
        <KpiCard icon={<AlertTriangle className="h-4 w-4 text-destructive" />} value={counts.issues} label="Needs attention" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Your applications</h2>
          <Link to="/farmer/apply" className="text-sm font-medium text-primary hover:underline">
            New application <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        {apps.length === 0 ? (
          <EmptyState
            text="You haven't applied for any scheme yet."
            cta={
              <Link to="/farmer/apply">
                <Button>Browse schemes</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {apps.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{a.scheme?.name ?? "Scheme"}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.crop} · Land {a.land_id} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                  {a.status === "docs_incomplete" && a.ai_completeness?.missing && a.ai_completeness.missing.length > 0 && (
                    <div className="mt-1 text-xs text-destructive">
                      Missing: {a.ai_completeness.missing.join(", ")}
                    </div>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Your grievances</h2>
          <Link to="/farmer/grievance" className="text-sm font-medium text-primary hover:underline">
            New grievance <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        {griev.length === 0 ? (
          <EmptyState text="No grievances filed." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {griev.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{g.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.ai_category ?? "General"} · {new Date(g.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge p={g.priority} />
                  <StatusBadge status={g.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">{icon}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    submitted: { label: "Submitted", cls: "bg-info/10 text-info", icon: <Clock className="h-3 w-3" /> },
    docs_incomplete: { label: "Docs missing", cls: "bg-warning/15 text-warning", icon: <AlertTriangle className="h-3 w-3" /> },
    fraud_flagged: { label: "Fraud check", cls: "bg-destructive/10 text-destructive", icon: <AlertTriangle className="h-3 w-3" /> },
    under_review: { label: "Under review", cls: "bg-info/10 text-info", icon: <Clock className="h-3 w-3" /> },
    field_verified: { label: "Field verified", cls: "bg-success/10 text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
    approved: { label: "Approved", cls: "bg-success/15 text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
    rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive", icon: <XCircle className="h-3 w-3" /> },
    open: { label: "Open", cls: "bg-info/10 text-info", icon: <Clock className="h-3 w-3" /> },
    in_progress: { label: "In progress", cls: "bg-warning/15 text-warning", icon: <Clock className="h-3 w-3" /> },
    resolved: { label: "Resolved", cls: "bg-success/15 text-success", icon: <CheckCircle2 className="h-3 w-3" /> },
    closed: { label: "Closed", cls: "bg-muted text-muted-foreground", icon: <XCircle className="h-3 w-3" /> },
  };
  const it = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${it.cls}`}>
      {it.icon}
      {it.label}
    </span>
  );
}

export function PriorityBadge({ p }: { p: string }) {
  const cls =
    p === "high" ? "bg-destructive/10 text-destructive" :
    p === "medium" ? "bg-warning/15 text-warning" :
    "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${cls}`}>{p}</span>;
}
