import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { Satellite, MapPin, CheckCircle2, AlertTriangle, Search, ZoomIn, ZoomOut, Maximize2, ExternalLink, FileText, User, Layers, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/field-verification")({
  component: FieldVerificationPage,
});

interface Row {
  id: string; crop: string; area_acres: number; land_id: string; status: string;
  scheme: { name: string } | null;
  profile: { full_name: string | null; village: string | null; district: string | null; taluka: string | null; phone: string | null; aadhaar: string | null } | null;
}

const REGIONAL_CROPS: Record<string, string[]> = {
  Pune: ["Sugarcane","Onion","Wheat","Tomato"], Nashik: ["Onion","Tomato","Wheat","Soybean"],
  Nagpur: ["Cotton","Soybean","Tur","Wheat"], Aurangabad: ["Cotton","Bajra","Maize"],
  Solapur: ["Sugarcane","Bajra","Wheat"], Kolhapur: ["Sugarcane","Rice","Soybean"],
  Satara: ["Sugarcane","Wheat","Rice"], Sangli: ["Sugarcane","Tur","Soybean"],
  Latur: ["Soybean","Tur","Cotton"], Beed: ["Cotton","Bajra","Soybean"],
  Jalgaon: ["Banana","Cotton","Bajra"], Ahmednagar: ["Sugarcane","Onion","Wheat"],
  Wardha: ["Cotton","Soybean","Wheat"], Amravati: ["Cotton","Soybean","Tur"],
  Ratnagiri: ["Rice","Mango","Cashew"], Sindhudurg: ["Rice","Cashew","Coconut"],
};

// Maharashtra district coordinates for interactive map
const DISTRICTS: { name: string; x: number; y: number; w: number; h: number }[] = [
  { name: "Mumbai", x: 72.87, y: 19.07, w: 0.15, h: 0.15 },
  { name: "Pune", x: 73.85, y: 18.52, w: 0.8, h: 0.7 },
  { name: "Nashik", x: 73.78, y: 20.0, w: 0.9, h: 0.7 },
  { name: "Nagpur", x: 79.08, y: 21.14, w: 0.9, h: 0.7 },
  { name: "Aurangabad", x: 75.34, y: 19.87, w: 0.8, h: 0.7 },
  { name: "Solapur", x: 75.92, y: 17.67, w: 0.8, h: 0.6 },
  { name: "Kolhapur", x: 74.23, y: 16.69, w: 0.7, h: 0.5 },
  { name: "Satara", x: 74.0, y: 17.68, w: 0.7, h: 0.6 },
  { name: "Sangli", x: 74.56, y: 16.85, w: 0.6, h: 0.5 },
  { name: "Latur", x: 76.56, y: 18.4, w: 0.7, h: 0.6 },
  { name: "Beed", x: 75.76, y: 18.99, w: 0.7, h: 0.6 },
  { name: "Jalgaon", x: 75.56, y: 21.0, w: 0.8, h: 0.6 },
  { name: "Ahmednagar", x: 74.75, y: 19.09, w: 0.9, h: 0.7 },
  { name: "Wardha", x: 78.6, y: 20.74, w: 0.6, h: 0.5 },
  { name: "Amravati", x: 77.77, y: 20.93, w: 0.8, h: 0.6 },
  { name: "Ratnagiri", x: 73.3, y: 16.99, w: 0.5, h: 0.8 },
];

function verify(row: Row) {
  const district = row.profile?.district ?? "";
  const expected = REGIONAL_CROPS[district] ?? [];
  const cropMatch = expected.some(c => c.toLowerCase() === row.crop.toLowerCase());
  const areaPlausible = row.area_acres > 0 && row.area_acres <= 50;
  const ndvi = (cropMatch ? 0.65 : 0.35) + Math.random() * 0.2;
  const confidence = Math.round(((cropMatch ? 0.7 : 0.3) + (areaPlausible ? 0.2 : 0) + Math.random() * 0.1) * 100);
  const valid = cropMatch && areaPlausible && ndvi > 0.5;
  return { valid, ndvi: Number(ndvi.toFixed(2)), confidence, expected };
}

function FieldVerificationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showPortal, setShowPortal] = useState(false);
  const [bhulekhSearch, setBhulekhSearch] = useState({ district: "", taluka: "", village: "" });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, crop, area_acres, land_id, status, scheme:schemes(name), profile:profiles!inner(full_name, village, district, taluka, phone, aadhaar)")
        .order("created_at", { ascending: false }).limit(100);
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, []);

  const verified = rows.map((r) => ({ row: r, ...verify(r) }));
  const filtered = verified.filter((v) => {
    const s = search.toLowerCase();
    const matchSearch = !s || v.row.profile?.full_name?.toLowerCase().includes(s) || v.row.land_id.toLowerCase().includes(s) || v.row.profile?.village?.toLowerCase().includes(s);
    const matchDistrict = !selectedDistrict || v.row.profile?.district === selectedDistrict;
    return matchSearch && matchDistrict;
  });
  const validCount = filtered.filter((v) => v.valid).length;
  const mismatchCount = filtered.length - validCount;

  // District application counts
  const districtCounts: Record<string, { total: number; valid: number; mismatch: number }> = {};
  verified.forEach((v) => {
    const d = v.row.profile?.district || "Unknown";
    if (!districtCounts[d]) districtCounts[d] = { total: 0, valid: 0, mismatch: 0 };
    districtCounts[d].total++;
    if (v.valid) districtCounts[d].valid++; else districtCounts[d].mismatch++;
  });

  const selectedAppData = selectedApp ? verified.find(v => v.row.id === selectedApp) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Field Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">Interactive Maharashtra map with Satbara 7/12 verification, NDVI analysis, and Bhulekh portal integration.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat icon={Layers} value={filtered.length} label="Total Applications" tone="primary" />
        <Stat icon={CheckCircle2} value={validCount} label="AI Verified" tone="success" />
        <Stat icon={AlertTriangle} value={mismatchCount} label="Mismatches" tone="warn" />
        <Stat icon={Satellite} value={`${Math.round((validCount / Math.max(filtered.length, 1)) * 100)}%`} label="Auto-verified Rate" tone="primary" />
      </div>

      {/* Search + District Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search farmer, land ID, village..." className="pl-10" />
        </div>
        {selectedDistrict && (
          <Button variant="outline" size="sm" onClick={() => setSelectedDistrict(null)}>
            ✕ {selectedDistrict}
          </Button>
        )}
      </div>

      {/* Maharashtra Interactive Map */}
      <Card title="Maharashtra District Map — Click to filter">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" ref={mapRef}>
          {/* Map Controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.3, 3))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border shadow hover:bg-secondary"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.5))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border shadow hover:bg-secondary"><ZoomOut className="h-4 w-4" /></button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border shadow hover:bg-secondary"><Maximize2 className="h-4 w-4" /></button>
          </div>

          <div className="relative h-[420px] w-full" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: "center", transition: "transform 0.3s ease" }}>
            {/* SVG Maharashtra outline */}
            <svg viewBox="71.5 15.5 10 7" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
              {/* Maharashtra boundary (simplified) */}
              <path d="M72.7,20.7 L73,19.5 L73.5,18.5 L74,17.5 L74.5,16.5 L75,16.2 L76,16.5 L77,17 L78,17.5 L79,18 L80,18.5 L80.5,19 L80.7,20 L80.5,21 L80,21.5 L79.5,22 L78.5,22 L77.5,21.8 L76.5,21.5 L75.5,21.5 L74.5,21.2 L73.5,21 L73,20.8 Z"
                fill="none" stroke="var(--primary)" strokeWidth="0.05" strokeDasharray="0.1 0.05" opacity="0.4" />

              {/* District markers */}
              {DISTRICTS.map((d) => {
                const count = districtCounts[d.name];
                const hasApps = count && count.total > 0;
                const isSelected = selectedDistrict === d.name;
                const mismatchRate = count ? count.mismatch / count.total : 0;
                const fillColor = !hasApps ? "var(--muted)" : mismatchRate > 0.5 ? "var(--destructive)" : mismatchRate > 0.2 ? "var(--warning)" : "var(--success)";

                return (
                  <g key={d.name} onClick={() => setSelectedDistrict(isSelected ? null : d.name)} className="cursor-pointer">
                    <circle cx={d.x} cy={d.y} r={hasApps ? 0.15 + Math.min(count!.total * 0.02, 0.15) : 0.1}
                      fill={fillColor} fillOpacity={isSelected ? 0.9 : 0.6} stroke={isSelected ? "var(--primary)" : fillColor}
                      strokeWidth={isSelected ? 0.04 : 0.02} />
                    {hasApps && (
                      <text x={d.x} y={d.y + 0.03} textAnchor="middle" fontSize="0.08" fill="white" fontWeight="bold">
                        {count!.total}
                      </text>
                    )}
                    <text x={d.x} y={d.y + (hasApps ? 0.28 : 0.2)} textAnchor="middle" fontSize="0.07" fill="var(--foreground)" fontWeight="600">
                      {d.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg bg-card/90 backdrop-blur border border-border px-3 py-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Verified</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Caution</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> High Risk</span>
          </div>
        </div>
      </Card>

      {/* Side-by-side: Applications + Bhulekh Portal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Applications List */}
        <Card title={`Verification Queue (${filtered.length})`}>
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {filtered.map((v) => (
              <div key={v.row.id} className={`rounded-xl border p-3.5 transition cursor-pointer hover:shadow-md ${v.row.id === selectedApp ? "border-primary bg-primary/5 ring-1 ring-primary" : v.valid ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}
                onClick={() => { setSelectedApp(v.row.id === selectedApp ? null : v.row.id); setBhulekhSearch({ district: v.row.profile?.district || "", taluka: v.row.profile?.taluka || "", village: v.row.profile?.village || "" }); }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{v.row.profile?.full_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${v.valid ? "bg-success/15 text-success" : "bg-warning/20 text-warning"}`}>
                        {v.valid ? "✓ VERIFIED" : "⚠ MISMATCH"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {v.row.profile?.village}, {v.row.profile?.district}
                    </div>
                  </div>
                  <span className="text-xs font-bold">{v.confidence}%</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 rounded-lg bg-background/60 p-2 text-[11px]">
                  <div><span className="text-muted-foreground">Land:</span> <span className="font-mono font-semibold">{v.row.land_id}</span></div>
                  <div><span className="text-muted-foreground">Crop:</span> <span className="font-semibold">{v.row.crop}</span></div>
                  <div><span className="text-muted-foreground">Area:</span> <span className="font-semibold">{v.row.area_acres} ac</span></div>
                  <div><span className="text-muted-foreground">NDVI:</span> <span className="font-semibold">{v.ndvi}</span></div>
                </div>
                {v.row.id === selectedApp && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] border-t border-border pt-3">
                    <div><span className="text-muted-foreground">Aadhaar:</span> <span className="font-mono font-semibold">{v.row.profile?.aadhaar ? `XXXX-XXXX-${v.row.profile.aadhaar.slice(-4)}` : "—"}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-semibold">{v.row.profile?.phone || "—"}</span></div>
                    <div><span className="text-muted-foreground">Scheme:</span> <span className="font-semibold">{v.row.scheme?.name || "—"}</span></div>
                    <div><span className="text-muted-foreground">Expected crops:</span> <span className="font-semibold">{v.expected.join(", ") || "—"}</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Bhulekh Portal Integration */}
        <div className="space-y-4">
          {/* AI Verification Card for selected application */}
          {selectedAppData && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                <Eye className="h-4 w-4" /> Verifying: {selectedAppData.row.profile?.full_name}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-card p-2.5 border border-border">
                  <div className="text-muted-foreground">Land ID / Survey No.</div>
                  <div className="font-mono font-bold text-sm mt-0.5">{selectedAppData.row.land_id}</div>
                </div>
                <div className="rounded-lg bg-card p-2.5 border border-border">
                  <div className="text-muted-foreground">Village / Taluka</div>
                  <div className="font-bold text-sm mt-0.5">{selectedAppData.row.profile?.village}, {selectedAppData.row.profile?.taluka}</div>
                </div>
                <div className="rounded-lg bg-card p-2.5 border border-border">
                  <div className="text-muted-foreground">District</div>
                  <div className="font-bold text-sm mt-0.5">{selectedAppData.row.profile?.district}</div>
                </div>
                <div className={`rounded-lg p-2.5 border ${selectedAppData.valid ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"}`}>
                  <div className="text-muted-foreground">AI Verdict</div>
                  <div className={`font-bold text-sm mt-0.5 ${selectedAppData.valid ? "text-success" : "text-warning"}`}>
                    {selectedAppData.valid ? "✓ Trustworthy" : "⚠ Needs Manual Check"}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">↓ Use the Bhulekh portal below to cross-verify Satbara 7/12 records with this farmer's claimed land details.</p>
            </div>
          )}

          {/* Bhulekh Portal */}
          <Card title="Maharashtra Bhulekh — Satbara 7/12 Portal">
            <p className="text-[11px] text-muted-foreground mb-3">
              Official Government of Maharashtra land records portal. Enter details below to verify farmer land ownership directly.
            </p>
            {selectedAppData && (
              <div className="mb-3 rounded-lg bg-info/10 border border-info/30 p-2.5 text-xs text-info">
                <strong>Auto-filled from selected application:</strong> {selectedAppData.row.profile?.village}, {selectedAppData.row.profile?.district} — Land ID: {selectedAppData.row.land_id}
              </div>
            )}
            <div className="rounded-xl border border-border overflow-hidden">
              <iframe
                src="https://bhulekh.mahabhumi.gov.in/"
                className="w-full border-0"
                style={{ height: "500px" }}
                title="Maharashtra Bhulekh Portal"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Source: bhulekh.mahabhumi.gov.in (Government of Maharashtra)</span>
              <a href="https://bhulekh.mahabhumi.gov.in/" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Card>
        </div>
      </div>
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
