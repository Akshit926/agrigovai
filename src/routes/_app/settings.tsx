import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Shield, Cpu, Database, User, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, district, state").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name ?? "Officer Admin");
      setPhone(data?.phone ?? "");
      setDistrict(data?.district ?? "");
      setState(data?.state ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, full_name: name, phone, district, state,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, AI engines, and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary"><User className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-foreground">{name || "Officer"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="District" value={district} onChange={setDistrict} />
            <Field label="State" value={state} onChange={setState} />
          </div>
          <Button onClick={save} disabled={busy} className="mt-4 w-full gap-2 sm:w-auto">
            <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save profile"}
          </Button>
        </Card>

        <Card title="Notifications">
          <div className="space-y-3">
            <Toggle icon={Bell} label="Email alerts for fraud flags" defaultChecked />
            <Toggle icon={Bell} label="High-priority grievance alerts" defaultChecked />
            <Toggle icon={Bell} label="Weekly digest" />
          </div>
        </Card>

        <Card title="AI Engines">
          <div className="space-y-3">
            <Toggle icon={Cpu} label="Document OCR & Validation" defaultChecked />
            <Toggle icon={Cpu} label="Fraud Detection (Isolation Forest)" defaultChecked />
            <Toggle icon={Cpu} label="Grievance NLP Classifier" defaultChecked />
            <Toggle icon={Cpu} label="Field Verification (NDVI)" defaultChecked />
            <Toggle icon={Cpu} label="Demand Forecasting" defaultChecked />
          </div>
        </Card>

        <Card title="Security & Data">
          <div className="space-y-3">
            <Toggle icon={Shield} label="Two-factor authentication" />
            <Toggle icon={Shield} label="Audit log export" defaultChecked />
            <Toggle icon={Database} label="Auto-backup database" defaultChecked />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ icon: Icon, label, defaultChecked }: { icon: React.ComponentType<{ className?: string }>; label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />{label}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
