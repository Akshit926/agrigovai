import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, FileText, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/applications")({
  component: AdminApplications,
});

interface AppFull {
  id: string;
  status: string;
  crop: string;
  area_acres: number;
  land_id: string;
  season: string | null;
  priority_score: number;
  submitted_documents: string[];
  ai_completeness: { complete?: boolean; missing?: string[]; score?: number } | null;
  ai_fraud: { flagged?: boolean; reasons?: string[]; riskScore?: number } | null;
  admin_notes: string | null;
  created_at: string;
  scheme: { name: string; required_documents: string[] } | null;
  profile: { full_name: string | null; phone: string | null; village: string | null; district: string | null } | null;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needs_action", label: "Needs action" },
  { key: "fraud_flagged", label: "Fraud flags" },
  { key: "docs_incomplete", label: "Docs missing" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function AdminApplications() {
  const [apps, setApps] = useState<AppFull[]>([]);
  const [filter, setFilter] = useState("needs_action");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, scheme:schemes(name, required_documents), profile:profiles!applications_farmer_id_fkey(full_name, phone, village, district)")
      .order("priority_score", { ascending: false })
      .order("created_at", { ascending: false });
    setApps((data ?? []) as unknown as AppFull[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = apps.filter((a) => {
    if (filter === "all") return true;
    if (filter === "needs_action") return ["submitted", "docs_incomplete", "fraud_flagged", "under_review"].includes(a.status);
    return a.status === filter;
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: status as never, admin_notes: notes[id] ?? null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Application ${status.replace("_", " ")}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorted by AI priority. Open any row to review AI checks and decide.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No applications match this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((a) => (
            <div key={a.id} className="border-b border-border last:border-0">
              <button
                onClick={() => setOpen(open === a.id ? null : a.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{a.profile?.full_name ?? "Farmer"}</span>
                    <span className="text-xs text-muted-foreground">{a.profile?.village ?? ""}{a.profile?.district ? `, ${a.profile.district}` : ""}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.scheme?.name} · {a.crop} · Land {a.land_id} · {a.area_acres} acres
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Priority {a.priority_score}
                  </span>
                  <Pill status={a.status} />
                </div>
              </button>

              {open === a.id && (
                <div className="space-y-4 border-t border-border bg-background/50 px-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <AIBlock
                      title="Document AI"
                      icon={<FileText className="h-4 w-4" />}
                      tone={a.ai_completeness?.complete ? "ok" : "warn"}
                    >
                      <div className="text-xs text-muted-foreground">
                        Score: <span className="font-semibold text-foreground">{a.ai_completeness?.score ?? 0}/100</span>
                      </div>
                      {a.ai_completeness?.missing && a.ai_completeness.missing.length > 0 ? (
                        <div className="mt-2 text-xs">
                          <div className="font-medium text-destructive">Missing:</div>
                          <ul className="ml-4 list-disc text-muted-foreground">
                            {a.ai_completeness.missing.map((m) => <li key={m}>{m}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-success">All required documents provided.</div>
                      )}
                    </AIBlock>

                    <AIBlock
                      title="Fraud / Duplicate"
                      icon={<ShieldAlert className="h-4 w-4" />}
                      tone={a.ai_fraud?.flagged ? "danger" : "ok"}
                    >
                      <div className="text-xs text-muted-foreground">
                        Risk: <span className="font-semibold text-foreground">{a.ai_fraud?.riskScore ?? 0}/100</span>
                      </div>
                      {a.ai_fraud?.reasons && a.ai_fraud.reasons.length > 0 ? (
                        <ul className="mt-2 ml-4 list-disc text-xs text-destructive">
                          {a.ai_fraud.reasons.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                      ) : (
                        <div className="mt-2 text-xs text-success">No anomalies detected.</div>
                      )}
                    </AIBlock>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Detail label="Phone" value={a.profile?.phone ?? "—"} />
                    <Detail label="Season" value={a.season ?? "—"} />
                    <Detail label="Submitted" value={new Date(a.created_at).toLocaleString()} />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Officer notes</div>
                    <Textarea
                      rows={2}
                      placeholder="Add notes (visible internally)…"
                      defaultValue={a.admin_notes ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setStatus(a.id, "approved")} className="gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "under_review")}>
                      Mark under review
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "field_verified")}>
                      Field verified
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setStatus(a.id, "rejected")} className="gap-1.5">
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIBlock({ title, icon, tone, children }: { title: string; icon: React.ReactNode; tone: "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const cls = tone === "ok" ? "border-success/30 bg-success/5" : tone === "warn" ? "border-warning/30 bg-warning/5" : "border-destructive/30 bg-destructive/5";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
        {tone === "danger" && <AlertTriangle className="ml-auto h-4 w-4 text-destructive" />}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function Pill({ status }: { status: string }) {
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
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
