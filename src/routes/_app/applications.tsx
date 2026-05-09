import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, FileText, Filter, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "./dashboard";

export const Route = createFileRoute("/_app/applications")({
  component: ApplicationsPage,
});

interface AppFull {
  id: string; status: string; crop: string; area_acres: number; land_id: string;
  season: string | null; priority_score: number; submitted_documents: string[];
  document_urls: Record<string, string> | null;
  ai_completeness: { complete?: boolean; missing?: string[]; score?: number } | null;
  ai_fraud: { flagged?: boolean; reasons?: string[]; riskScore?: number } | null;
  admin_notes: string | null; created_at: string;
  scheme: { name: string; required_documents: string[] } | null;
  profile: { full_name: string | null; phone: string | null; village: string | null; district: string | null } | null;
}

const FILTERS = [
  { key: "needs_action", label: "Needs Action" },
  { key: "all", label: "All" },
  { key: "fraud_flagged", label: "Fraud" },
  { key: "docs_incomplete", label: "Docs Missing" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function ApplicationsPage() {
  const [apps, setApps] = useState<AppFull[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, scheme:schemes(name, required_documents), profile:profiles!inner(full_name, phone, village, district)")
      .order("priority_score", { ascending: false }).order("created_at", { ascending: false });
    setApps((data ?? []) as unknown as AppFull[]);
  };
  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, (payload) => {
        load();
        if (payload.eventType === "INSERT") toast.info("New application received");
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = apps.filter((a) => {
    if (q && !(`${a.profile?.full_name} ${a.scheme?.name} ${a.crop} ${a.land_id}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (filter === "all") return true;
    if (filter === "needs_action") return ["submitted", "docs_incomplete", "fraud_flagged", "under_review"].includes(a.status);
    return a.status === filter;
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status: status as never, admin_notes: notes[id] ?? null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Application ${status.replace("_", " ")}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-prioritised queue. Document checks and fraud signals shown inline.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search farmer, crop, land…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}>{f.label}</button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No applications match.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          {filtered.map((a) => (
            <div key={a.id} className="border-b border-border last:border-0">
              <button onClick={() => setOpen(open === a.id ? null : a.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-secondary/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{a.profile?.full_name ?? "Farmer"}</span>
                    <span className="text-xs text-muted-foreground">{a.profile?.village}, {a.profile?.district}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.scheme?.name} · {a.crop} · Land {a.land_id} · {a.area_acres} acres
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <span className="text-[10px] uppercase text-muted-foreground">Priority</span>
                    <span className="rounded bg-primary-soft px-1.5 py-0.5 text-xs font-bold text-primary">{a.priority_score}</span>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              </button>

              {open === a.id && (
                <div className="space-y-4 border-t border-border bg-background/50 px-5 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <AIBlock title="Document AI" icon={<FileText className="h-4 w-4" />} tone={a.ai_completeness?.complete ? "ok" : "warn"} score={a.ai_completeness?.score ?? 0}>
                      {a.ai_completeness?.missing && a.ai_completeness.missing.length > 0 ? (
                        <div className="text-xs">
                          <div className="font-medium text-destructive">Missing:</div>
                          <ul className="ml-4 list-disc text-muted-foreground">{a.ai_completeness.missing.map((m) => <li key={m}>{m}</li>)}</ul>
                        </div>
                      ) : <div className="text-xs text-success">All required documents present.</div>}
                    </AIBlock>

                    <AIBlock title="Fraud Detection" icon={<ShieldAlert className="h-4 w-4" />} tone={a.ai_fraud?.flagged ? "danger" : "ok"} score={a.ai_fraud?.riskScore ?? 0}>
                      {a.ai_fraud?.reasons && a.ai_fraud.reasons.length > 0 ? (
                        <ul className="ml-4 list-disc text-xs text-destructive">{a.ai_fraud.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                      ) : <div className="text-xs text-success">No anomalies detected.</div>}
                    </AIBlock>
                  </div>

                  {a.document_urls && Object.keys(a.document_urls).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Uploaded documents</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(a.document_urls).map(([name, path]) => (
                          <button key={name} type="button"
                            onClick={async () => {
                              const { data } = await supabase.storage.from("farmer-documents").createSignedUrl(path, 300);
                              if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              else toast.error("Could not open document");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:bg-secondary">
                            <FileText className="h-3.5 w-3.5" /> {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Officer notes</div>
                    <Textarea rows={2} placeholder="Internal notes…" defaultValue={a.admin_notes ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))} className="mt-1" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setStatus(a.id, "approved")} className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "under_review")}>Mark Under Review</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "field_verified")}>Field Verified</Button>
                    <Button size="sm" variant="destructive" onClick={() => setStatus(a.id, "rejected")} className="gap-1.5"><XCircle className="h-4 w-4" /> Reject</Button>
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

function AIBlock({ title, icon, tone, score, children }: { title: string; icon: React.ReactNode; tone: "ok" | "warn" | "danger"; score: number; children: React.ReactNode }) {
  const cls = tone === "ok" ? "border-success/30 bg-success/5" : tone === "warn" ? "border-warning/30 bg-warning/5" : "border-destructive/30 bg-destructive/5";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}{title}
        {tone === "danger" && <AlertTriangle className="ml-auto h-4 w-4 text-destructive" />}
      </div>
      <div className="mt-2 mb-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${tone === "ok" ? "bg-success" : tone === "warn" ? "bg-warning" : "bg-destructive"}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-bold text-foreground">{score}%</span>
      </div>
      {children}
    </div>
  );
}
