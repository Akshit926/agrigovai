import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Power, X, Wheat, IndianRupee, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/schemes")({
  component: SchemesAdmin,
});

interface Scheme {
  id: string; name: string; code: string; description: string; category: string;
  required_documents: string[]; max_amount: number | null; active: boolean; created_at: string;
}

const empty = { name: "", code: "", description: "", category: "Subsidy", required_documents: "", max_amount: "" };

function SchemesAdmin() {
  const [rows, setRows] = useState<Scheme[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data } = await supabase.from("schemes").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Scheme[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-schemes")
      .on("postgres_changes", { event: "*", schema: "public", table: "schemes" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const startNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const startEdit = (s: Scheme) => {
    setEditId(s.id);
    setForm({
      name: s.name, code: s.code, description: s.description, category: s.category,
      required_documents: s.required_documents.join(", "),
      max_amount: s.max_amount?.toString() ?? "",
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      category: form.category.trim() || "Subsidy",
      required_documents: form.required_documents.split(",").map((s) => s.trim()).filter(Boolean),
      max_amount: form.max_amount ? Number(form.max_amount) : null,
    };
    if (!payload.name || !payload.code || !payload.description) { toast.error("Fill name, code and description"); return; }
    const { error } = editId
      ? await supabase.from("schemes").update(payload).eq("id", editId)
      : await supabase.from("schemes").insert({ ...payload, active: true });
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Scheme updated" : "Scheme created");
    setOpen(false);
  };

  const toggle = async (s: Scheme) => {
    const { error } = await supabase.from("schemes").update({ active: !s.active }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success(`Scheme ${!s.active ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schemes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add and manage government schemes available to farmers. Updates appear in real time.</p>
        </div>
        <Button onClick={startNew}><Plus className="mr-1 h-4 w-4" /> New scheme</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.code} · {s.category}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {s.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{s.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.required_documents.slice(0, 4).map((d) => (
                <span key={d} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>
              ))}
              {s.required_documents.length > 4 && <span className="text-[10px] text-muted-foreground">+{s.required_documents.length - 4}</span>}
            </div>
            {s.max_amount && (
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                <IndianRupee className="h-3 w-3" /> {s.max_amount.toLocaleString("en-IN")}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(s)}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
              <Button size="sm" variant="outline" onClick={() => toggle(s)}><Power className="mr-1 h-3 w-3" /> {s.active ? "Disable" : "Enable"}</Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-2">No schemes yet. Click <span className="font-semibold">New scheme</span> to add one.</p>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editId ? "Edit scheme" : "Add new scheme"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. PM-KISAN" /></div>
              <div className="space-y-1.5"><Label>Code *</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PMK-001" /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Subsidy / Insurance / Credit" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Description & benefits *</Label><Textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the scheme, eligibility and benefits" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Required documents (comma-separated)</Label><Input value={form.required_documents} onChange={(e) => setForm({ ...form, required_documents: e.target.value })} placeholder="Aadhaar, Land Record, Bank Passbook" /></div>
              <div className="space-y-1.5"><Label>Max amount (₹)</Label><Input type="number" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editId ? "Save changes" : "Create scheme"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
