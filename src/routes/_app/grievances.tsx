import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/grievances")({
  component: GrievancesPage,
});

interface Griev {
  id: string; subject: string; description: string; ai_category: string | null;
  priority: string; status: string; admin_response: string | null; created_at: string;
  profile: { full_name: string | null; phone: string | null; village: string | null } | null;
}

const FILTERS = ["all", "open", "in_progress", "high", "resolved"] as const;

function GrievancesPage() {
  const [items, setItems] = useState<Griev[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("open");
  const [open, setOpen] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("grievances")
      .select("*, profile:profiles!inner(full_name, phone, village)")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as unknown as Griev[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((g) => {
    if (filter === "all") return true;
    if (filter === "high") return g.priority === "high" && g.status !== "closed";
    return g.status === filter;
  });

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("grievances").update({ status: status as never, admin_response: responses[id] ?? null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Grievance updated");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grievance Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">NLP-classified by category & urgency. High-priority cases surfaced automatically.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium uppercase transition-colors ${
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}>{f.replace("_", " ")}</button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Inbox clear.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <button onClick={() => setOpen(open === g.id ? null : g.id)} className="w-full px-5 py-4 text-left hover:bg-secondary/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{g.subject}</h3>
                      <PrioBadge p={g.priority} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {g.profile?.full_name ?? "Farmer"} · {g.profile?.village ?? "—"} · {new Date(g.created_at).toLocaleDateString()}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">{g.ai_category ?? "General"}</span>
                      <StatusPill status={g.status} />
                    </div>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              {open === g.id && (
                <div className="space-y-4 border-t border-border bg-background/50 px-5 py-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{g.description}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Response</div>
                    <Textarea rows={3} defaultValue={g.admin_response ?? ""} placeholder="Write a response or note…"
                      onChange={(e) => setResponses((r) => ({ ...r, [g.id]: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => update(g.id, "in_progress")}>Mark In Progress</Button>
                    <Button size="sm" onClick={() => update(g.id, "resolved")} className="gap-1.5"><CheckCircle2 className="h-4 w-4" /> Resolve</Button>
                    <Button size="sm" variant="ghost" onClick={() => update(g.id, "closed")}>Escalate / Close</Button>
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

function PrioBadge({ p }: { p: string }) {
  const cls = p === "high" ? "bg-destructive/10 text-destructive" : p === "medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{p}</span>;
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { open: "bg-info/10 text-info", in_progress: "bg-warning/15 text-warning", resolved: "bg-success/15 text-success", closed: "bg-muted text-muted-foreground" };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-muted"}`}>{status.replace("_", " ")}</span>;
}
