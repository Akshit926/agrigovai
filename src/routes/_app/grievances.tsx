import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare, Filter, Search, Clock, AlertTriangle, TrendingUp, Inbox, Send, ChevronDown, ChevronUp, Sparkles, User, MapPin, Phone, FileText, XCircle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/grievances")({ component: GrievancesPage });

interface Griev {
  id: string; subject: string; description: string; ai_category: string | null;
  priority: string; status: string; admin_response: string | null; created_at: string;
  profile: { full_name: string | null; phone: string | null; village: string | null; district: string | null } | null;
}

const STATUS_OPTS = ["all", "open", "in_progress", "resolved", "closed"] as const;
const PRIO_OPTS = ["all", "high", "medium", "low"] as const;
const PIE_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#6b7280"];

const REPLY_TEMPLATES = [
  "Your grievance has been received and assigned to the concerned officer. Expected resolution: 7 working days.",
  "We need additional documents to process your complaint. Please upload the required documents.",
  "Your issue has been escalated to the district-level officer for immediate attention.",
  "After investigation, we found your complaint valid. The corrective action has been initiated.",
  "Your grievance has been resolved. If you face any further issues, please file a new complaint.",
];

function GrievancesPage() {
  const [items, setItems] = useState<Griev[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prioFilter, setPrioFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("grievances")
      .select("*, profile:profiles(full_name, phone, village, district)")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as unknown as Griev[]);
  };
  useEffect(() => { load(); const ch = supabase.channel("admin-griev").on("postgres_changes", { event: "*", schema: "public", table: "grievances" }, () => load()).subscribe(); return () => { supabase.removeChannel(ch); }; }, []);

  const categories = [...new Set(items.map(g => g.ai_category).filter(Boolean))] as string[];

  const filtered = items.filter((g) => {
    const s = search.toLowerCase();
    const matchSearch = !s || g.subject.toLowerCase().includes(s) || g.profile?.full_name?.toLowerCase().includes(s) || g.id.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    const matchPrio = prioFilter === "all" || g.priority === prioFilter;
    const matchCat = catFilter === "all" || g.ai_category === catFilter;
    return matchSearch && matchStatus && matchPrio && matchCat;
  });

  // Analytics
  const total = items.length;
  const resolved = items.filter(g => g.status === "resolved" || g.status === "closed").length;
  const pending = items.filter(g => g.status === "open" || g.status === "in_progress").length;
  const highPrio = items.filter(g => g.priority === "high" && g.status !== "resolved" && g.status !== "closed").length;

  const statusPie = [
    { name: "Open", value: items.filter(g => g.status === "open").length },
    { name: "In Progress", value: items.filter(g => g.status === "in_progress").length },
    { name: "Resolved", value: items.filter(g => g.status === "resolved").length },
    { name: "Closed", value: items.filter(g => g.status === "closed").length },
  ];

  const catChart: Record<string, number> = {};
  items.forEach(g => { const c = g.ai_category || "Other"; catChart[c] = (catChart[c] ?? 0) + 1; });
  const catData = Object.entries(catChart).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const update = async (id: string, status: string) => {
    const resp = responses[id];
    const upd: Record<string, unknown> = { status };
    if (resp) upd.admin_response = resp;
    const { error } = await supabase.from("grievances").update(upd as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Grievance updated — farmer notified");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grievance Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-classified complaints with priority detection, reply system, and real-time sync with farmer portal.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MessageSquare} value={total} label="Total Complaints" tone="bg-primary-soft text-primary" />
        <StatCard icon={CheckCircle2} value={resolved} label="Resolved" tone="bg-success/15 text-success" />
        <StatCard icon={Clock} value={pending} label="Pending" tone="bg-warning/15 text-warning" />
        <StatCard icon={AlertTriangle} value={highPrio} label="High Priority Open" tone="bg-destructive/10 text-destructive" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Status Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""} labelLine={false}>
                {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Category-wise Complaints">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by subject, farmer, ID..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{STATUS_OPTS.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Status" : s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={prioFilter} onValueChange={setPrioFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>{PRIO_OPTS.map(p => <SelectItem key={p} value={p}>{p === "all" ? "All Priority" : p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="flex items-center text-xs text-muted-foreground">{filtered.length} shown</span>
      </div>

      {/* Grievance List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No grievances match filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <button onClick={() => setExpanded(expanded === g.id ? null : g.id)} className="w-full px-5 py-4 text-left hover:bg-secondary/50 transition">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{g.subject}</h3>
                      <PrioBadge p={g.priority} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{g.profile?.full_name ?? "Farmer"}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{g.profile?.village ?? "—"}, {g.profile?.district ?? "—"}</span>
                      <span>{new Date(g.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">{g.ai_category ?? "General"}</span>
                      <StatusPill status={g.status} />
                      <span className="font-mono text-[10px] text-muted-foreground">#{g.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  {expanded === g.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>
              </button>

              {expanded === g.id && (
                <div className="space-y-4 border-t border-border bg-background/50 px-5 py-4">
                  {/* Farmer details */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoBox label="Farmer" value={g.profile?.full_name ?? "—"} icon={User} />
                    <InfoBox label="Phone" value={g.profile?.phone ?? "—"} icon={Phone} />
                    <InfoBox label="Village" value={g.profile?.village ?? "—"} icon={MapPin} />
                    <InfoBox label="District" value={g.profile?.district ?? "—"} icon={MapPin} />
                  </div>

                  {/* AI Analysis */}
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> AI Analysis</div>
                    <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Category:</span> <span className="font-semibold">{g.ai_category ?? "General"}</span></div>
                      <div><span className="text-muted-foreground">Priority:</span> <span className="font-semibold">{g.priority}</span></div>
                      <div><span className="text-muted-foreground">Status:</span> <span className="font-semibold">{g.status.replace("_", " ")}</span></div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Complaint Description</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground bg-secondary/50 rounded-lg p-3">{g.description}</p>
                  </div>

                  {/* Existing admin response */}
                  {g.admin_response && (
                    <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                      <div className="text-xs font-semibold text-success mb-1">Previous Response</div>
                      <p className="text-sm">{g.admin_response}</p>
                    </div>
                  )}

                  {/* Reply */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Reply to Farmer</span>
                      <Select onValueChange={(v) => setResponses(r => ({ ...r, [g.id]: v }))}>
                        <SelectTrigger className="h-7 w-[160px] text-[11px]"><SelectValue placeholder="AI Templates" /></SelectTrigger>
                        <SelectContent>{REPLY_TEMPLATES.map((t, i) => <SelectItem key={i} value={t} className="text-xs">{t.slice(0, 50)}...</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Textarea rows={3} value={responses[g.id] ?? ""} placeholder="Type your response..."
                      onChange={(e) => setResponses((r) => ({ ...r, [g.id]: e.target.value }))} />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => update(g.id, "in_progress")}><Clock className="mr-1.5 h-3.5 w-3.5" /> In Progress</Button>
                    <Button size="sm" onClick={() => update(g.id, "resolved")}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Resolve</Button>
                    <Button size="sm" variant="outline" onClick={() => update(g.id, "closed")}><XCircle className="mr-1.5 h-3.5 w-3.5" /> Close</Button>
                    {responses[g.id] && (
                      <Button size="sm" variant="secondary" onClick={() => update(g.id, g.status)}><Send className="mr-1.5 h-3.5 w-3.5" /> Send Reply Only</Button>
                    )}
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

function InfoBox({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
      <div className="mt-0.5 text-xs font-semibold">{value}</div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, tone }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
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
