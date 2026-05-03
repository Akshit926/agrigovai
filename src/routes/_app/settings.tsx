import { createFileRoute } from "@tanstack/react-router";
import { Bell, Shield, Cpu, Database, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Card } from "./dashboard";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
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
            <div>
              <div className="font-semibold text-foreground">Officer Admin</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Role" value="District Agriculture Officer" />
            <Row label="Department" value="Maharashtra Agri Dept." />
            <Row label="Last login" value={new Date().toLocaleString()} />
          </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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
