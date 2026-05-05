import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FilePlus2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "./index";

export const Route = createFileRoute("/_farmer/farmer/applications")({
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
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("applications")
      .select("*, scheme:schemes(name, code)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your scheme applications and AI review results.</p>
        </div>
        <Link to="/farmer/apply" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
          <FilePlus2 className="h-4 w-4" /> New application
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No applications yet.</p>
          <Link to="/farmer/apply" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Apply for a scheme</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{r.scheme?.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.scheme?.code} · {r.crop} ({r.season}) · {r.area_acres} acres · Land {r.land_id}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">Submitted {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {r.ai_completeness && !r.ai_completeness.complete && (r.ai_completeness.missing?.length ?? 0) > 0 && (
                <div className="mt-3 rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
                  Missing: {r.ai_completeness.missing!.join(", ")}
                </div>
              )}
              {r.ai_fraud?.flagged && (
                <div className="mt-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  Flagged: {r.ai_fraud.reasons?.join(" · ")}
                </div>
              )}
              {r.admin_notes && (
                <div className="mt-2 rounded-lg bg-secondary p-2.5 text-xs">
                  <span className="font-semibold">Officer note:</span> {r.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
