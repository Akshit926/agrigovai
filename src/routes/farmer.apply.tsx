import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ShieldAlert, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkCompleteness, detectFraud, priorityScore } from "@/lib/ai-rules";

export const Route = createFileRoute("/farmer/apply")({
  component: ApplyPage,
});

interface Scheme { id: string; name: string; code: string; description: string; required_documents: string[]; max_amount: number | null; category: string }

function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeId, setSchemeId] = useState<string>("");
  const [crop, setCrop] = useState("");
  const [season, setSeason] = useState("Kharif");
  const [landId, setLandId] = useState("");
  const [area, setArea] = useState<string>("");
  const [docs, setDocs] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("schemes").select("*").eq("active", true).order("name").then(({ data }) => setSchemes((data ?? []) as Scheme[]));
  }, []);

  const scheme = schemes.find((s) => s.id === schemeId);
  const completeness = useMemo(() => scheme ? checkCompleteness(scheme.required_documents, Array.from(docs)) : null, [scheme, docs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !scheme) return;
    setBusy(true);
    const areaNum = parseFloat(area || "0");

    // Fetch prior apps for fraud detection (own + same land in same scheme — RLS may limit but we use what we can)
    const { data: prior } = await supabase
      .from("applications")
      .select("id,land_id,scheme_id,area_acres,farmer_id,created_at")
      .eq("scheme_id", scheme.id);

    const fraud = detectFraud(
      { land_id: landId, scheme_id: scheme.id, area_acres: areaNum, farmer_id: user.id },
      (prior ?? []) as never,
    );
    const comp = checkCompleteness(scheme.required_documents, Array.from(docs));
    const status = fraud.flagged ? "fraud_flagged" : !comp.complete ? "docs_incomplete" : "submitted";
    const score = Math.round(priorityScore(areaNum, comp.score, fraud.riskScore));

    // Upload selected files to storage
    const document_urls: Record<string, string> = {};
    for (const [doc, file] of Object.entries(files)) {
      const safe = doc.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const path = `${user.id}/${Date.now()}-${safe}-${file.name}`;
      const up = await supabase.storage.from("farmer-documents").upload(path, file, { upsert: false });
      if (up.error) { toast.error(`Upload failed: ${up.error.message}`); setBusy(false); return; }
      document_urls[doc] = up.data.path;
    }

    const { error } = await supabase.from("applications").insert({
      farmer_id: user.id,
      scheme_id: scheme.id,
      land_id: landId,
      crop,
      season,
      area_acres: areaNum,
      submitted_documents: Array.from(docs),
      document_urls: document_urls as never,
      status: status as never,
      priority_score: score,
      ai_completeness: comp as never,
      ai_fraud: fraud as never,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application submitted. AI review complete.");
    navigate({ to: "/farmer/applications" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Apply for a Scheme</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fill in the details. Our AI will pre-check documents and flag issues instantly.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Scheme *</Label>
          <Select value={schemeId} onValueChange={setSchemeId}>
            <SelectTrigger><SelectValue placeholder="Select a government scheme" /></SelectTrigger>
            <SelectContent>
              {schemes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} <span className="text-muted-foreground">· {s.code}</span></SelectItem>)}
            </SelectContent>
          </Select>
          {scheme && <p className="text-[11px] text-muted-foreground">{scheme.description}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Crop *</Label><Input required value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Wheat" /></div>
          <div className="space-y-1.5">
            <Label>Season *</Label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Kharif","Rabi","Zaid"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Land ID / Survey No. *</Label><Input required value={landId} onChange={(e) => setLandId(e.target.value)} placeholder="e.g. MH-PUN-1234" /></div>
          <div className="space-y-1.5"><Label>Area (acres) *</Label><Input required type="number" step="0.1" min="0.1" value={area} onChange={(e) => setArea(e.target.value)} /></div>
        </div>

        {scheme && (
          <div className="space-y-2">
            <Label>Documents submitted</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {scheme.required_documents.map((d) => {
                const checked = docs.has(d);
                return (
                  <label key={d} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition ${checked ? "border-primary bg-primary-soft" : "border-border bg-background hover:bg-secondary"}`}>
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      const n = new Set(docs); e.target.checked ? n.add(d) : n.delete(d); setDocs(n);
                    }} className="h-4 w-4 accent-current" />
                    <span>{d}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <Button type="submit" disabled={busy || !scheme} className="w-full sm:w-auto">
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </form>

      <aside className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Pre-Check
          </div>
          {!scheme && <p className="mt-3 text-xs text-muted-foreground">Select a scheme to see live document analysis.</p>}
          {scheme && completeness && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"><span>Document completeness</span><span>{completeness.score}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full transition-all" style={{ width: `${completeness.score}%`, background: completeness.complete ? "var(--success)" : "var(--warning)" }} />
                </div>
              </div>
              {completeness.complete ? (
                <div className="flex items-start gap-2 rounded-lg bg-success/10 p-2.5 text-xs text-success"><CheckCircle2 className="mt-0.5 h-4 w-4" /> All required documents provided.</div>
              ) : (
                <div className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
                  <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Missing documents</div>
                  <ul className="mt-1 list-inside list-disc text-warning/90">{completeness.missing.map((m) => <li key={m}>{m}</li>)}</ul>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-lg bg-info/10 p-2.5 text-xs text-info">
                <ShieldAlert className="mt-0.5 h-4 w-4" />
                <span>Fraud & duplicate detection runs automatically on submission.</span>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Tips</div>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li>• Use exact land/survey number from your 7/12 extract.</li>
            <li>• Area must match your land record to avoid review delays.</li>
            <li>• Keep digital copies of all documents ready.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
