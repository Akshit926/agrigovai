import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FilePlus2, Inbox, ChevronDown, ChevronUp, Calendar, Layers, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "./farmer.index";

export const Route = createFileRoute("/farmer/applications")({
  component: MyApplications,
});

interface Row {
  id: string; status: string; crop: string; area_acres: number; land_id: string;
  season: string | null; created_at: string; admin_notes: string | null; priority_score: number;
  ai_completeness: { complete?: boolean; missing?: string[]; score?: number } | null;
  ai_fraud: { flagged?: boolean; reasons?: string[]; riskScore?: number } | null;
  scheme: { name: string; code: string } | null;
}

function MyApplications() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from("applications")
      .select("*, scheme:schemes(name, code)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
    load();
    const ch = supabase
      .channel("farmer-apps-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `farmer_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("nav.applications")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your scheme applications and AI review results.</p>
        </div>
        <Link to="/farmer/apply" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
          <FilePlus2 className="h-4 w-4" /> {t("nav.apply")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{t("dash.no_apps")}</p>
          <Link to="/farmer/apply" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{t("dash.apply_cta")}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition">
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{r.scheme?.name}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-muted-foreground">{r.scheme?.code}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString()}</span>
                    <span>{r.crop} · {r.area_acres} acres</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.land_id}</span>
                  </div>
                </div>
                <StatusBadge status={r.status} />
                {expanded === r.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {expanded === r.id && (
                <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <DetailItem label={t("apply.land_id")} value={r.land_id} />
                    <DetailItem label={t("apply.season")} value={r.season ?? "—"} />
                    <DetailItem label={t("apply.area")} value={`${r.area_acres} acres`} />
                    <DetailItem label="Priority" value={`${r.priority_score}/100`} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {r.ai_completeness && (
                      <div className={`rounded-lg p-3 text-xs ${r.ai_completeness.complete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        <div className="font-semibold">{t("apply.doc_completeness")}: {r.ai_completeness.score}%</div>
                        {!r.ai_completeness.complete && r.ai_completeness.missing && (
                          <div className="mt-1">{t("apply.missing_docs")}: {r.ai_completeness.missing.join(", ")}</div>
                        )}
                      </div>
                    )}
                    {r.ai_fraud?.flagged && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                        <div className="font-semibold">Fraud Risk: {r.ai_fraud.riskScore}/100</div>
                        {r.ai_fraud.reasons && <div className="mt-1">{r.ai_fraud.reasons.join(" · ")}</div>}
                      </div>
                    )}
                  </div>

                  {r.admin_notes && (
                    <div className="rounded-lg bg-primary/5 p-3 text-xs">
                      <span className="font-semibold text-primary">{t("griev.officer_response")}:</span> {r.admin_notes}
                    </div>
                  )}

                  {/* Progress timeline */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {["submitted", "under_review", "field_verified", "approved"].map((step, i) => {
                      const steps = ["submitted", "under_review", "field_verified", "approved"];
                      const currentIdx = steps.indexOf(r.status);
                      const active = i <= currentIdx;
                      return (
                        <div key={step} className="flex items-center">
                          {i > 0 && <div className={`mx-1 h-0.5 w-4 sm:w-8 ${active ? "bg-primary" : "bg-border"}`} />}
                          <div className={`flex h-6 items-center justify-center rounded-full px-2 text-[9px] font-semibold uppercase tracking-wider ${active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
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
