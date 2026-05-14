import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ShieldAlert, FileText, Sparkles, ArrowRight, ArrowLeft, Check, Upload, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkCompleteness, detectFraud, priorityScore } from "@/lib/ai-rules";
import { getSchemeConfig, type SchemeConfig } from "@/lib/scheme-config";

export const Route = createFileRoute("/farmer/apply")({
  component: ApplyPage,
});

interface Scheme { id: string; name: string; code: string; description: string; required_documents: string[]; max_amount: number | null; category: string }

const STEPS = ["scheme", "details", "questions", "documents", "review"] as const;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ApplyPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { add: addNotif } = useNotifications();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeId, setSchemeId] = useState("");
  const [crop, setCrop] = useState("");
  const [season, setSeason] = useState("Kharif");
  const [landId, setLandId] = useState("");
  const [area, setArea] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("schemes").select("*").eq("active", true).order("name").then(({ data }) => setSchemes((data ?? []) as Scheme[]));
  }, []);

  const scheme = schemes.find((s) => s.id === schemeId);
  const config = scheme ? getSchemeConfig(scheme.code) : undefined;
  const docs = config?.documents ?? (scheme?.required_documents.map(d => ({ key: d, label: { en: d, hi: d, mr: d } })) ?? []);
  const uploadedDocs = useMemo(() => docs.filter((d) => files[d.key]).map((d) => d.key), [docs, files]);
  const completeness = useMemo(() => {
    const reqKeys = docs.map(d => d.key);
    return checkCompleteness(reqKeys, uploadedDocs);
  }, [docs, uploadedDocs]);

  useEffect(() => { setFiles({}); setAnswers({}); }, [schemeId]);

  const stepLabels = [t("apply.step1"), t("apply.step2"), t("apply.step3"), t("apply.step4"), t("apply.step5")];

  const canNext = () => {
    if (step === 0) return !!schemeId;
    if (step === 1) return crop.trim() && landId.trim() && Number(area) > 0;
    if (step === 2) return true;
    if (step === 3) return completeness.complete;
    return true;
  };

  const submit = async () => {
    if (!user || !scheme) return;
    const cropValue = crop.trim();
    const landValue = landId.trim().toUpperCase();
    const areaNum = Number(area);
    setBusy(true);

    const { data: prior } = await supabase.from("applications").select("id,land_id,scheme_id,area_acres,farmer_id,created_at").eq("scheme_id", scheme.id);
    const fraud = detectFraud({ land_id: landValue, scheme_id: scheme.id, area_acres: areaNum, farmer_id: user.id }, (prior ?? []) as never);
    const comp = checkCompleteness(docs.map(d => d.key), uploadedDocs);
    const status = fraud.flagged ? "fraud_flagged" : "submitted";
    const score = Math.round(priorityScore(areaNum, comp.score, fraud.riskScore));

    const document_urls: Record<string, string> = {};
    for (const doc of docs) {
      const file = files[doc.key];
      if (!file) continue;
      const safe = doc.key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `${user.id}/${Date.now()}-${safe}-${safeName}`;
      const up = await supabase.storage.from("farmer-documents").upload(path, file, { upsert: false });
      if (up.error) { toast.error(`Upload failed: ${up.error.message}`); setBusy(false); return; }
      document_urls[doc.key] = up.data.path;
    }

    const { error } = await supabase.from("applications").insert({
      farmer_id: user.id, scheme_id: scheme.id, land_id: landValue, crop: cropValue, season,
      area_acres: areaNum, submitted_documents: uploadedDocs, document_urls: document_urls as never,
      status: status as never, priority_score: score, ai_completeness: comp as never, ai_fraud: fraud as never,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("apply.success"));
    addNotif({ type: "success", title: t("notif.app_submitted"), message: `${scheme.name} — ${cropValue}, ${areaNum} acres` });
    navigate({ to: "/farmer/applications" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {/* Progress stepper */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-sm">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && <div className={`mx-1 h-0.5 w-3 sm:w-6 ${i <= step ? "bg-primary" : "bg-border"}`} />}
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/10 text-primary cursor-pointer" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="text-xl font-bold">{t("apply.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("apply.subtitle")}</p>
          </div>

          {/* Step 1: Scheme Selection */}
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {schemes.map((s) => (
                <button key={s.id} onClick={() => setSchemeId(s.id)}
                  className={`group rounded-xl border-2 p-4 text-left transition hover:shadow-md ${schemeId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${schemeId === s.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      <Sprout className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold tracking-wide">{s.code}</span>
                    </div>
                    {schemeId === s.id && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{s.name}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{s.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Land & Crop Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>{t("apply.crop")} *</Label><Input required value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Wheat" /></div>
                <div className="space-y-1.5">
                  <Label>{t("apply.season")} *</Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Kharif","Rabi","Zaid"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>{t("apply.land_id")} *</Label><Input required value={landId} onChange={(e) => setLandId(e.target.value)} placeholder="e.g. MH-PUN-1234" /></div>
                <div className="space-y-1.5"><Label>{t("apply.area")} *</Label><Input required type="number" step="0.1" min="0.1" value={area} onChange={(e) => setArea(e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Step 3: Eligibility Questions */}
          {step === 2 && config && (
            <div className="space-y-3">
              {config.questions.map((q) => (
                <div key={q.id} className="rounded-lg border border-border bg-background p-3.5">
                  {q.type === "checkbox" ? (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={!!answers[q.id]}
                        onCheckedChange={(v) => setAnswers({ ...answers, [q.id]: !!v })}
                        className="mt-0.5"
                      />
                      <span className="text-sm">{q.label[lang] || q.label.en}</span>
                    </label>
                  ) : q.type === "select" && q.options ? (
                    <div className="space-y-1.5">
                      <Label>{q.label[lang] || q.label.en}</Label>
                      <Select value={(answers[q.id] as string) || ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{q.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label[lang] || o.label.en}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              ))}
              {!config && <p className="text-sm text-muted-foreground">No additional questions for this scheme.</p>}
            </div>
          )}
          {step === 2 && !config && (
            <p className="text-sm text-muted-foreground">No additional eligibility questions for this scheme. Proceed to upload documents.</p>
          )}

          {/* Step 4: Document Upload */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">Accepted: PDF, JPG, PNG · Max 10 MB each</p>
              {docs.map((d) => {
                const file = files[d.key];
                return (
                  <div key={d.key} className={`rounded-xl border-2 p-4 transition ${file ? "border-primary bg-primary/5" : "border-dashed border-border"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${file ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        {file ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{d.label[lang] || d.label.en}</div>
                        {file && <div className="text-[11px] text-success">✓ {file.name}</div>}
                      </div>
                    </div>
                    <input type="file" accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) { const next = { ...files }; delete next[d.key]; setFiles(next); return; }
                        if (!ALLOWED_FILE_TYPES.includes(f.type)) { toast.error("Only PDF, JPG, and PNG allowed"); e.currentTarget.value = ""; return; }
                        if (f.size > MAX_FILE_SIZE) { toast.error("File too large (max 10 MB)"); e.currentTarget.value = ""; return; }
                        setFiles({ ...files, [d.key]: f });
                      }}
                      className="mt-3 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && scheme && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewRow label={t("apply.step1")} value={`${scheme.name} (${scheme.code})`} />
                <ReviewRow label={t("apply.crop")} value={crop} />
                <ReviewRow label={t("apply.season")} value={season} />
                <ReviewRow label={t("apply.land_id")} value={landId} />
                <ReviewRow label={t("apply.area")} value={`${area} acres`} />
                <ReviewRow label={t("apply.doc_completeness")} value={`${completeness.score}%`} />
              </div>
              {config && (
                <div className="rounded-lg bg-secondary p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("apply.step3")}</div>
                  {config.questions.map((q) => (
                    <div key={q.id} className="flex items-center gap-2 text-xs py-1">
                      {answers[q.id] ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-muted-foreground">{q.label[lang] || q.label.en}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {t("apply.prev")}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                {t("apply.next")} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy}>
                {busy ? t("apply.submitting") : t("apply.submit")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI Sidebar */}
      <aside className="space-y-3">
        <div className="sticky top-4 space-y-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> {t("apply.ai_precheck")}</div>
            {!scheme ? <p className="mt-3 text-xs text-muted-foreground">{t("apply.select_scheme")}</p> : (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"><span>{t("apply.doc_completeness")}</span><span>{completeness.score}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full transition-all" style={{ width: `${completeness.score}%`, background: completeness.complete ? "var(--success)" : "var(--warning)" }} />
                  </div>
                </div>
                {completeness.complete ? (
                  <div className="flex items-start gap-2 rounded-lg bg-success/10 p-2.5 text-xs text-success"><CheckCircle2 className="mt-0.5 h-4 w-4" /> {t("apply.all_docs_ok")}</div>
                ) : (
                  <div className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
                    <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> {t("apply.missing_docs")}</div>
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
        </div>
      </aside>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
