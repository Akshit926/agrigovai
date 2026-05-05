import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, MessageSquare, CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_farmer/farmer/")({
  component: FarmerHome,
});

interface AppRow { id: string; status: string; crop: string; created_at: string; priority_score: number; scheme: { name: string } | null }
interface GRow { id: string; subject: string; status: string; priority: string; created_at: string; ai_category: string | null }

function FarmerHome() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [griev, setGriev] = useState<GRow[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null; village: string | null; district: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [a, g, p] = await Promise.all([
        supabase.from("applications").select("id,status,crop,created_at,priority_score, scheme:schemes(name)").eq("farmer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("grievances").select("id,subject,status,priority,created_at,ai_category").eq("farmer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("full_name,village,district").eq("id", user.id).maybeSingle(),
      ]);
      setApps((a.data ?? []) as unknown as AppRow[]);
      setGriev((g.data ?? []) as GRow[]);
      setProfile(p.data ?? null);
    })();
  }, [user]);

  const stats = [
    { label: "Total Applications", value: apps.length, icon: FileText, tone: "primary" },
    { label: "Approved", value: apps.filter(a => a.status === "approved").length, icon: CheckCircle2, tone: "success" },
    { label: "In Review", value: apps.filter(a => ["submitted","under_review","docs_incomplete"].includes(a.status)).length, icon: Clock, tone: "warn" },
    { label: "Open Grievances", value: griev.filter(g => g.status !== "resolved").length, icon: MessageSquare, tone: "info" },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border p-6 text-primary-foreground sm:p-8" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
              <Sprout className="h-3 w-3" /> Welcome back
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Namaste, {profile?.full_name ?? "Farmer"}</h1>
            <p className="mt-1 text-sm text-white/85">{profile?.village ? `${profile.village}, ${profile.district ?? ""}` : "Apply for government schemes and track your benefits in one place."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/farmer/apply" className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary shadow hover:bg-white/95">
                Apply for a scheme <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/farmer/grievance" className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                File a grievance
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent Applications" link="/farmer/applications">
          {apps.length === 0 ? <Empty msg="No applications yet. Apply for a scheme to get started." /> :
            <ul className="divide-y divide-border">
              {apps.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.scheme?.name ?? "Scheme"}</div>
                    <div className="text-[11px] text-muted-foreground">{a.crop} · {new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          }
        </Section>

        <Section title="Recent Grievances" link="/farmer/grievance">
          {griev.length === 0 ? <Empty msg="No grievances filed. We're here when you need us." /> :
            <ul className="divide-y divide-border">
              {griev.slice(0, 5).map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{g.subject}</div>
                    <div className="text-[11px] text-muted-foreground">{g.ai_category ?? "General"} · {new Date(g.created_at).toLocaleDateString()}</div>
                  </div>
                  <PriorityBadge priority={g.priority} />
                </li>
              ))}
            </ul>
          }
        </Section>
      </div>
    </div>
  );
}

function Section({ title, link, children }: { title: string; link: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="py-6 text-center text-xs text-muted-foreground">{msg}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    submitted: { label: "Submitted", cls: "bg-info/15 text-info", icon: Clock },
    under_review: { label: "Under Review", cls: "bg-warning/15 text-warning", icon: Clock },
    docs_incomplete: { label: "Docs Missing", cls: "bg-warning/15 text-warning", icon: AlertTriangle },
    fraud_flagged: { label: "Flagged", cls: "bg-destructive/15 text-destructive", icon: ShieldAlert },
    approved: { label: "Approved", cls: "bg-success/15 text-success", icon: CheckCircle2 },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive", icon: AlertTriangle },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground", icon: Clock };
  const Icon = m.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}><Icon className="h-3 w-3" /> {m.label}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === "high" ? "bg-destructive/15 text-destructive" : priority === "medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{priority}</span>;
}
