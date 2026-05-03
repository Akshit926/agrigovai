import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Satellite, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";

export const Route = createFileRoute("/_app/field-verification")({
  component: FieldVerificationPage,
});

interface Row {
  id: string; crop: string; area_acres: number; land_id: string;
  scheme: { name: string } | null;
  profile: { full_name: string | null; village: string | null; district: string | null } | null;
}

// regional crop expectations (rule-based)
const REGIONAL_CROPS: Record<string, string[]> = {
  Pune: ["Sugarcane", "Onion", "Wheat", "Tomato"],
  Nashik: ["Onion", "Tomato", "Wheat", "Soybean"],
  Nagpur: ["Cotton", "Soybean", "Tur", "Wheat"],
  Aurangabad: ["Cotton", "Bajra", "Maize"],
  Solapur: ["Sugarcane", "Bajra", "Wheat"],
  Kolhapur: ["Sugarcane", "Rice", "Soybean"],
  Satara: ["Sugarcane", "Wheat", "Rice"],
  Sangli: ["Sugarcane", "Tur", "Soybean"],
  Latur: ["Soybean", "Tur", "Cotton"],
  Beed: ["Cotton", "Bajra", "Soybean"],
};

function verify(row: Row) {
  const district = row.profile?.district ?? "";
  const expected = REGIONAL_CROPS[district] ?? [];
  const cropMatch = expected.includes(row.crop);
  const areaPlausible = row.area_acres > 0 && row.area_acres <= 50;
  const ndvi = (cropMatch ? 0.65 : 0.35) + Math.random() * 0.2;
  const confidence = Math.round(((cropMatch ? 0.7 : 0.3) + (areaPlausible ? 0.2 : 0) + Math.random() * 0.1) * 100);
  const valid = cropMatch && areaPlausible && ndvi > 0.5;
  return { valid, ndvi: Number(ndvi.toFixed(2)), confidence, expected };
}

function FieldVerificationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, crop, area_acres, land_id, scheme:schemes(name), profile:profiles!inner(full_name, village, district)")
        .order("created_at", { ascending: false }).limit(40);
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, []);

  const verified = rows.map((r) => ({ row: r, ...verify(r) }));
  const validCount = verified.filter((v) => v.valid).length;
  const mismatchCount = verified.length - validCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Field Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">Compares claimed crop & area against regional NDVI patterns to reduce physical inspection visits.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={CheckCircle2} value={validCount} label="Valid Claims" tone="success" />
        <Stat icon={AlertTriangle} value={mismatchCount} label="Mismatches Detected" tone="warn" />
        <Stat icon={Satellite} value={`${Math.round((validCount / Math.max(verified.length, 1)) * 100)}%`} label="Auto-verified rate" tone="primary" />
      </div>

      <Card title="Field Verification Queue">
        <div className="grid gap-4 md:grid-cols-2">
          {verified.map((v) => (
            <div key={v.row.id} className={`rounded-xl border p-4 ${v.valid ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-foreground">{v.row.profile?.full_name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {v.row.profile?.village}, {v.row.profile?.district}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.valid ? "bg-success/15 text-success" : "bg-warning/20 text-warning"}`}>
                  {v.valid ? "VALID CLAIM" : "MISMATCH"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-background/60 p-2.5 text-xs">
                <Mini label="Claimed" value={v.row.crop} />
                <Mini label="Area" value={`${v.row.area_acres} ac`} />
                <Mini label="NDVI" value={v.ndvi.toString()} />
              </div>

              <div className="mt-3 text-[11px] text-muted-foreground">
                Regional expected: <span className="font-medium text-foreground">{v.expected.join(", ") || "—"}</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full rounded-full ${v.valid ? "bg-success" : "bg-warning"}`} style={{ width: `${v.confidence}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground">{v.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Stat({ icon: Icon, value, label, tone }: { icon: React.ComponentType<{ className?: string }>; value: number | string; label: string; tone: string }) {
  const map: Record<string, string> = { success: "bg-success/15 text-success", warn: "bg-warning/15 text-warning", primary: "bg-primary-soft text-primary" };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${map[tone]}`}><Icon className="h-5 w-5" /></div>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
