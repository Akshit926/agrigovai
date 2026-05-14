import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, MessageSquare, CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight, Sprout, FilePlus2, MessageSquarePlus, UserCircle, Bell, ChevronDown, ChevronUp, MapPin, Calendar, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/farmer/")({
  component: FarmerHome,
});

interface AppRow { id: string; status: string; crop: string; area_acres: number; land_id: string; season: string | null; created_at: string; priority_score: number; admin_notes: string | null; ai_completeness: { complete?: boolean; missing?: string[]; score?: number } | null; ai_fraud: { flagged?: boolean; reasons?: string[]; riskScore?: number } | null; scheme: { name: string; code: string } | null }
interface GRow { id: string; subject: string; status: string; priority: string; created_at: string; ai_category: string | null; admin_response: string | null }

function FarmerHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [griev, setGriev] = useState<GRow[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null; village: string | null; district: string | null } | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [a, g, p] = await Promise.all([
        supabase.from("applications").select("id,status,crop,area_acres,land_id,season,created_at,priority_score,admin_notes,ai_completeness,ai_fraud, scheme:schemes(name,code)").eq("farmer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("grievances").select("id,subject,status,priority,created_at,ai_category,admin_response").eq("farmer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("full_name,village,district").eq("id", user.id).maybeSingle(),
      ]);
      setApps((a.data ?? []) as unknown as AppRow[]);
      setGriev((g.data ?? []) as GRow[]);
      setProfile(p.data ?? null);
    })();
  }, [user]);

  const stats = [
    { label: t("dash.total_apps"), value: apps.length, icon: FileText, tone: "bg-primary/10 text-primary" },
    { label: t("dash.approved"), value: apps.filter(a => a.status === "approved").length, icon: CheckCircle2, tone: "bg-success/15 text-success" },
    { label: t("dash.in_review"), value: apps.filter(a => ["submitted","under_review","docs_incomplete"].includes(a.status)).length, icon: Clock, tone: "bg-warning/15 text-warning" },
    { label: t("dash.open_grievances"), value: griev.filter(g => g.status !== "resolved").length, icon: MessageSquare, tone: "bg-info/15 text-info" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="overflow-hidden rounded-2xl border border-border p-6 text-primary-foreground sm:p-8" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
              <Sprout className="h-3 w-3" /> {t("dash.welcome")}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("dash.namaste")}, {profile?.full_name ?? "Farmer"}</h1>
            <p className="mt-1 text-sm text-white/85">{profile?.village ? `${profile.village}, ${profile.district ?? ""}` : t("dash.no_apps").split(".")[0]}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/farmer/apply" className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary shadow hover:bg-white/95">
                <FilePlus2 className="h-4 w-4" /> {t("dash.apply_cta")}
              </Link>
              <Link to="/farmer/grievance" className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                <MessageSquarePlus className="h-4 w-4" /> {t("dash.file_grievance")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.tone}`}><Icon className="h-4 w-4" /></div>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">{t("dash.quick_actions")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { to: "/farmer/apply", icon: FilePlus2, label: t("nav.apply"), color: "bg-primary/10 text-primary" },
            { to: "/farmer/grievance", icon: MessageSquarePlus, label: t("nav.grievance"), color: "bg-warning/15 text-warning" },
            { to: "/farmer/applications", icon: FileText, label: t("nav.applications"), color: "bg-info/15 text-info" },
            { to: "/farmer/profile", icon: UserCircle, label: t("dash.view_profile"), color: "bg-success/15 text-success" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.to} to={a.to as "/farmer/apply"} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.color}`}><Icon className="h-4 w-4" /></div>
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Applied Schemes with expandable details */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{t("dash.recent_apps")}</h2>
          <Link to="/farmer/applications" className="text-[11px] font-medium text-primary hover:underline">{t("nav.applications")} →</Link>
        </div>
        <div className="p-3">
          {apps.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">{t("dash.no_apps")}</div>
          ) : (
            <div className="space-y-2">
              {apps.slice(0, 6).map((a) => (
                <div key={a.id} className="overflow-hidden rounded-xl border border-border bg-background transition">
                  <button
                    onClick={() => setExpandedApp(expandedApp === a.id ? null : a.id)}
                    className="flex w-full items-center gap-3 p-3.5 text-left transition hover:bg-secondary/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{a.scheme?.name ?? "Scheme"}</span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-muted-foreground">{a.scheme?.code}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(a.created_at).toLocaleDateString()}</span>
                        <span>{a.crop} · {a.area_acres} acres</span>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                    {expandedApp === a.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {expandedApp === a.id && (
                    <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <DetailItem label={t("apply.land_id")} value={a.land_id} />
                        <DetailItem label={t("apply.season")} value={a.season ?? "—"} />
                        <DetailItem label={t("apply.area")} value={`${a.area_acres} acres`} />
                        <DetailItem label="Priority" value={`${a.priority_score}/100`} />
                      </div>
                      {/* AI Analysis */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {a.ai_completeness && (
                          <div className={`rounded-lg p-3 text-xs ${a.ai_completeness.complete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            <div className="font-semibold">{t("apply.doc_completeness")}: {a.ai_completeness.score}%</div>
                            {!a.ai_completeness.complete && a.ai_completeness.missing && (
                              <div className="mt-1">{t("apply.missing_docs")}: {a.ai_completeness.missing.join(", ")}</div>
                            )}
                          </div>
                        )}
                        {a.ai_fraud?.flagged && (
                          <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                            <div className="font-semibold">Fraud Risk: {a.ai_fraud.riskScore}/100</div>
                            {a.ai_fraud.reasons && <div className="mt-1">{a.ai_fraud.reasons.join(" · ")}</div>}
                          </div>
                        )}
                      </div>
                      {a.admin_notes && (
                        <div className="rounded-lg bg-primary/5 p-3 text-xs">
                          <span className="font-semibold text-primary">{t("griev.officer_response")}:</span> {a.admin_notes}
                        </div>
                      )}
                      {/* Timeline */}
                      <div className="flex items-center gap-1 overflow-x-auto py-1">
                        {["submitted", "under_review", "field_verified", "approved"].map((step, i) => {
                          const steps = ["submitted", "under_review", "field_verified", "approved"];
                          const currentIdx = steps.indexOf(a.status);
                          const active = i <= currentIdx;
                          const isRejected = a.status === "rejected" || a.status === "fraud_flagged";
                          return (
                            <div key={step} className="flex items-center">
                              {i > 0 && <div className={`mx-1 h-0.5 w-4 sm:w-8 ${active ? "bg-primary" : "bg-border"}`} />}
                              <div className={`flex h-6 items-center justify-center rounded-full px-2 text-[9px] font-semibold uppercase tracking-wider ${active ? (isRejected ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary") : "bg-secondary text-muted-foreground"}`}>
                                {step.replace("_", " ")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grievances */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{t("dash.recent_griev")}</h2>
          <Link to="/farmer/grievance" className="text-[11px] font-medium text-primary hover:underline">{t("nav.grievance")} →</Link>
        </div>
        <div className="p-3">
          {griev.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">{t("dash.no_griev")}</div>
          ) : (
            <div className="space-y-2">
              {griev.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{g.subject}</div>
                    <div className="text-[11px] text-muted-foreground">{g.ai_category ?? "General"} · {new Date(g.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={g.priority} />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${g.status === "resolved" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}>{g.status.replace("_"," ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    submitted: { label: "Submitted", cls: "bg-info/15 text-info", icon: Clock },
    under_review: { label: "Under Review", cls: "bg-warning/15 text-warning", icon: Clock },
    docs_incomplete: { label: "Docs Missing", cls: "bg-warning/15 text-warning", icon: AlertTriangle },
    fraud_flagged: { label: "Flagged", cls: "bg-destructive/15 text-destructive", icon: ShieldAlert },
    field_verified: { label: "Field Verified", cls: "bg-success/10 text-success", icon: CheckCircle2 },
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
