import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Sparkles, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { classifyGrievance } from "@/lib/ai-rules";
import { PriorityBadge } from "./index";

export const Route = createFileRoute("/farmer/grievance")({
  component: GrievancePage,
});

interface Row { id: string; subject: string; description: string; ai_category: string | null; priority: string; status: string; admin_response: string | null; created_at: string }

function GrievancePage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const ai = useMemo(() => classifyGrievance(`${subject} ${desc}`), [subject, desc]);

  const load = () => {
    if (!user) return;
    supabase.from("grievances").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setRows((data ?? []) as Row[]));
  };
  useEffect(load, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("grievances").insert({
      farmer_id: user.id,
      subject,
      description: desc,
      ai_category: ai.category,
      priority: ai.priority as never,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Grievance filed. An officer will respond soon.");
    setSubject(""); setDesc(""); load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold">File a Grievance</h1>
            <p className="mt-1 text-sm text-muted-foreground">Describe your issue. AI auto-classifies and prioritises it for the right officer.</p>
          </div>
          <div className="space-y-1.5"><Label>Subject *</Label><Input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short title (e.g. PM-KISAN payment not received)" /></div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea required value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} placeholder="Explain in detail — when did it start, which scheme, any reference numbers, what action you've taken." />
          </div>
          <Button type="submit" disabled={busy || !subject || !desc} className="w-full sm:w-auto">
            <MessageSquarePlus className="mr-1.5 h-4 w-4" /> {busy ? "Submitting…" : "Submit grievance"}
          </Button>
        </form>

        <div>
          <h2 className="mb-2 text-sm font-semibold">My grievances</h2>
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">You haven't filed any grievances yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{r.subject}</div>
                      <div className="text-[11px] text-muted-foreground">{r.ai_category ?? "General"} · {new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={r.priority} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.status === "resolved" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}>{r.status.replace("_"," ")}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{r.description}</p>
                  {r.admin_response && (
                    <div className="mt-2 rounded-lg bg-primary-soft p-2.5 text-xs text-primary">
                      <span className="font-semibold">Officer response:</span> {r.admin_response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside>
        <div className="sticky top-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> AI Classification</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Live preview as you type</p>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Category" value={ai.category} />
            <Row label="Priority" value={<PriorityBadge priority={ai.priority} />} />
            <Row label="Keywords" value={ai.keywords.length ? ai.keywords.join(", ") : "—"} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
