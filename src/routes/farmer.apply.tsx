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

const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeId, setSchemeId] = useState<string>("");
  const [crop, setCrop] = useState("");
  const [season, setSeason] = useState("Kharif");
  const [landId, setLandId] = useState("");
  const [area, setArea] = useState<string>("");
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("schemes").select("*").eq("active", true).order("name").then(({ data }) => setSchemes((data ?? []) as Scheme[]));
  }, []);

  const scheme = schemes.find((s) => s.id === schemeId);
  const uploadedDocs = useMemo(() => scheme ? scheme.required_documents.filter((doc) => files[doc]) : [], [scheme, files]);
  const completeness = useMemo(() => scheme ? checkCompleteness(scheme.required_documents, uploadedDocs) : null, [scheme, uploadedDocs]);

  useEffect(() => {
    setFiles({});
  }, [schemeId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !scheme) return;
    const cropValue = crop.trim();
    const landValue = landId.trim().toUpperCase();
    const areaNum = Number(area);
    if (scheme.required_documents.length === 0) { toast.error("This scheme has no required documents configured. Contact admin."); return; }
    const missingFiles = scheme.required_documents.filter((doc) => !files[doc]);
    if (!/^[\p{L}][\p{L}\s-]{1,59}$/u.test(cropValue)) { toast.error("Enter a valid crop name."); return; }
    if (!/^[A-Z0-9][A-Z0-9/.-]{3,39}$/.test(landValue)) { toast.error("Enter a valid land/survey number."); return; }
    if (!Number.isFinite(areaNum) || areaNum < 0.1 || areaNum > 100) { toast.error("Area must be between 0.1 and 100 acres."); return; }
    if (missingFiles.length > 0) { toast.error(`Upload all required documents: ${missingFiles.join(", ")}`); return; }
    for (const file of Object.values(files)) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) { toast.error("Only PDF, JPG, and PNG documents are allowed."); return; }
      if (file.size > MAX_FILE_SIZE) { toast.error("Each document must be 10 MB or smaller."); return; }
    }
    setBusy(true);

    // Fetch prior apps for fraud detection (own + same land in same scheme — RLS may limit but we use what we can)
    const { data: prior } = await supabase
      .from("applications")
      .select("id,land_id,scheme_id,area_acres,farmer_id,created_at")
      .eq("scheme_id", scheme.id);

    const fraud = detectFraud(
      { land_id: landValue, scheme_id: scheme.id, area_acres: areaNum, farmer_id: user.id },
      (prior ?? []) as never,
    );
    const comp = checkCompleteness(scheme.required_documents, uploadedDocs);
    const status = fraud.flagged ? "fraud_flagged" : "submitted";
    const score = Math.round(priorityScore(areaNum, comp.score, fraud.riskScore));

    // Upload selected files to storage
    const document_urls: Record<string, string> = {};
    for (const doc of scheme.required_documents) {
      const file = files[doc];
      const safe = doc.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `${user.id}/${Date.now()}-${safe}-${safeName}`;
      const up = await supabase.storage.from("farmer-documents").upload(path, file, { upsert: false });
      if (up.error) { toast.error(`Upload failed: ${up.error.message}`); setBusy(false); return; }
      document_urls[doc] = up.data.path;
    }

    const { error } = await supabase.from("applications").insert({
      farmer_id: user.id,
      scheme_id: scheme.id,
      land_id: landValue,
      crop: cropValue,
      season,
      area_acres: areaNum,
      submitted_documents: uploadedDocs,
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
            <Label>Required documents — upload each file</Label>
            <p className="text-[11px] text-muted-foreground">Accepted: PDF, JPG, PNG · Max 10 MB each. Every document is compulsory.</p>
            {scheme.required_documents.length === 0 && (
              <div className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">Admin must add required documents before farmers can apply for this scheme.</div>
            )}
            <div className="grid gap-2">
              {scheme.required_documents.map((d) => {
                const file = files[d];
                return (
                  <div key={d} className={`rounded-lg border p-3 text-sm transition ${file ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{d}</span>
                      {file && <span className="ml-auto text-[11px] text-success">✓ {file.name}</span>}
                    </div>
                    <input
                      type="file"
                      required
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) { const next = { ...files }; delete next[d]; setFiles(next); return; }
                        if (!ALLOWED_FILE_TYPES.includes(f.type)) { toast.error("Only PDF, JPG, and PNG documents are allowed"); e.currentTarget.value = ""; return; }
                        if (f.size > MAX_FILE_SIZE) { toast.error("File too large (max 10 MB)"); e.currentTarget.value = ""; return; }
                        setFiles({ ...files, [d]: f });
                      }}
                      className="mt-2 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
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
