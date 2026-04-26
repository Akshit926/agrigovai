import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, FileCheck2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkCompleteness, detectFraud, priorityScore } from "@/lib/ai-rules";

export const Route = createFileRoute("/farmer/apply")({
  component: ApplyPage,
});

interface Scheme {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  required_documents: string[];
  max_amount: number | null;
}

const formSchema = z.object({
  land_id: z.string().trim().min(3, "Enter a valid land/survey ID").max(50),
  crop: z.string().trim().min(2).max(50),
  area_acres: z.coerce.number().positive("Area must be positive").max(500),
  season: z.string().trim().min(2).max(20),
});

function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selected, setSelected] = useState<Scheme | null>(null);
  const [submittedDocs, setSubmittedDocs] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("schemes")
      .select("*")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setSchemes((data ?? []) as Scheme[]));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selected) return;
    const fd = new FormData(e.currentTarget);
    const parsed = formSchema.safeParse({
      land_id: fd.get("land_id"),
      crop: fd.get("crop"),
      area_acres: fd.get("area_acres"),
      season: fd.get("season"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const provided = selected.required_documents.filter((d) => submittedDocs[d]);
    const completeness = checkCompleteness(selected.required_documents, provided);

    // fetch prior apps for this scheme + land for fraud check
    const { data: prior } = await supabase
      .from("applications")
      .select("id, land_id, scheme_id, area_acres, farmer_id, created_at");

    const fraud = detectFraud(
      {
        land_id: parsed.data.land_id,
        scheme_id: selected.id,
        area_acres: parsed.data.area_acres,
        farmer_id: user.id,
      },
      prior ?? []
    );

    const status: "submitted" | "docs_incomplete" | "fraud_flagged" | "under_review" =
      !completeness.complete ? "docs_incomplete" :
      fraud.flagged ? "fraud_flagged" :
      "under_review";

    const score = priorityScore(parsed.data.area_acres, completeness.score, fraud.riskScore);

    const { error } = await supabase.from("applications").insert({
      farmer_id: user.id,
      scheme_id: selected.id,
      land_id: parsed.data.land_id,
      crop: parsed.data.crop,
      area_acres: parsed.data.area_acres,
      season: parsed.data.season,
      submitted_documents: provided,
      status,
      priority_score: Math.round(score),
      ai_completeness: completeness as unknown as Record<string, unknown>,
      ai_fraud: fraud as unknown as Record<string, unknown>,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (status === "docs_incomplete") {
      toast.warning(`Submitted, but missing: ${completeness.missing.join(", ")}`);
    } else if (status === "fraud_flagged") {
      toast.warning("Submitted — flagged for officer review (duplicate/fraud check).");
    } else {
      toast.success("Application submitted. You'll be notified on a decision.");
    }
    navigate({ to: "/farmer" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Apply for a scheme</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a scheme, confirm your documents, and submit. Our system runs eligibility and document checks instantly.
        </p>
      </div>

      {!selected ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {schemes.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelected(s);
                setSubmittedDocs({});
              }}
              className="group rounded-xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)] transition-all hover:border-primary hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-primary">{s.category}</div>
                  <h3 className="mt-1 font-semibold text-foreground">{s.name}</h3>
                </div>
                {s.max_amount ? (
                  <span className="rounded-md bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                    up to ₹{s.max_amount.toLocaleString("en-IN")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-3 text-xs text-muted-foreground">
                {s.required_documents.length} documents required
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-primary">{selected.category}</div>
                <h2 className="mt-1 text-xl font-bold text-foreground">{selected.name}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Change</Button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Land / Survey ID" name="land_id" placeholder="e.g. 234/5A" />
                <FormField label="Crop" name="crop" placeholder="e.g. Cotton" />
                <FormField label="Area (acres)" name="area_acres" type="number" placeholder="e.g. 2.5" step="0.1" />
                <FormField label="Season" name="season" placeholder="Kharif / Rabi" />
              </div>

              <div>
                <Label className="text-sm font-medium">Confirm documents you have</Label>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  Tick each document you've gathered. Missing ones can be added later — but the application will be marked incomplete.
                </p>
                <div className="space-y-2">
                  {selected.required_documents.map((d) => (
                    <label
                      key={d}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/40"
                    >
                      <input
                        type="checkbox"
                        checked={!!submittedDocs[d]}
                        onChange={(e) => setSubmittedDocs((s) => ({ ...s, [d]: e.target.checked }))}
                        className="h-4 w-4 accent-[oklch(0.42_0.14_152)]"
                      />
                      <span className="text-sm text-foreground">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Submitting…" : "Submit application"}
              </Button>
            </form>
          </div>

          <aside className="space-y-3 rounded-xl border border-border bg-primary-soft/40 p-5">
            <div className="flex items-center gap-2 text-primary">
              <FileCheck2 className="h-4 w-4" />
              <span className="text-sm font-semibold">What happens next</span>
            </div>
            <Step icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="Document AI" text="Auto-checks completeness in seconds." />
            <Step icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Fraud check" text="Cross-checks land & farmer records for duplicates." />
            <Step icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="Officer review" text="A district officer reviews and decides." />
          </aside>
        </div>
      )}
    </div>
  );
}

function FormField({ label, name, type = "text", placeholder, step }: { label: string; name: string; type?: string; placeholder?: string; step?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} step={step} required />
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">{icon}</div>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
