import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout, ShieldCheck, Mail, Lock, User as UserIcon, Phone, MapPin, FileCheck2, Brain, Satellite, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "officer" | "farmer";
type Tab = "signin" | "signup";

function LoginPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("officer");
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={role === "farmer" ? "/farmer" : "/dashboard"} />;

  const switchMode = (m: Mode) => {
    setMode(m);
    setTab("signin");
    if (m === "officer") { setEmail("admin@gmail.com"); setPassword("admin123"); }
    else { setEmail(""); setPassword(""); }
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name || "Farmer", phone, village, district, role: mode === "officer" ? "admin" : "farmer" },
        },
      });
      if (error) { toast.error(error.message); setBusy(false); return; }
      const si = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (si.error) { toast.success("Account created. Please sign in."); setTab("signin"); return; }
      toast.success("Welcome to AgriGov AI");
      navigate({ to: mode === "farmer" ? "/farmer" : "/dashboard" });
      return;
    }

    if (mode === "officer" && email.trim().toLowerCase() !== "admin@gmail.com") {
      setBusy(false);
      toast.error("Only the official admin account can sign in here.");
      return;
    }
    let res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error && mode === "officer" && email.trim().toLowerCase() === "admin@gmail.com" && res.error.message.toLowerCase().includes("invalid")) {
      const su = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: "Officer Admin", role: "admin" } },
      });
      if (su.error) { toast.error(su.error.message); setBusy(false); return; }
      res = await supabase.auth.signInWithPassword({ email, password });
    }
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Welcome to AgriGov AI");
    navigate({ to: mode === "farmer" ? "/farmer" : "/dashboard" });
  };

  const features = [
    { icon: FileCheck2, t: "Document AI", d: "Auto-detect missing or invalid documents instantly." },
    { icon: ShieldCheck, t: "Fraud Detection", d: "Flag duplicate land claims & oversized areas." },
    { icon: Satellite, t: "Field Verification", d: "NDVI satellite checks reduce on-ground visits." },
    { icon: MessageSquare, t: "Grievance NLP", d: "Auto-classify & prioritise farmer complaints." },
    { icon: Brain, t: "Decision Co-pilot", d: "One-click approvals with full audit trail." },
  ];

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* LEFT — Green branding panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 35%), radial-gradient(circle at 80% 75%, white 0, transparent 35%)"
        }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-lg">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">AgriGov AI</div>
              <div className="text-[11px] uppercase tracking-wider text-white/80">Government of India · Dept. of Agriculture</div>
            </div>
          </div>

          <h1 className="mt-12 text-4xl font-bold leading-tight">
            Smart Agriculture<br />Administration for India
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/85">
            One unified AI-powered platform for farmers and agriculture officers. Apply for schemes,
            file grievances, detect fraud and verify fields — all in one place.
          </p>
        </div>

        <div className="relative space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">What this platform does</div>
          <ul className="space-y-2.5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.t} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{f.t}</div>
                    <div className="text-xs text-white/80">{f.d}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex items-center gap-4 text-[11px] text-white/80">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 6 schemes</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 5 AI engines</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Aadhaar-grade security</span>
        </div>
      </aside>

      {/* RIGHT — White login panel */}
      <main className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-primary">AgriGov AI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Government of India</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "officer" ? "Officer Sign In" : tab === "signup" ? "Create Farmer Account" : "Farmer Sign In"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "officer" ? "Restricted access — administration console" : "Apply for schemes & track your benefits"}
          </p>

          {/* Mode tabs */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
            {(["officer", "farmer"] as Mode[]).map((m) => (
              <button key={m} onClick={() => switchMode(m)} type="button"
                className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${mode === m ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "officer" ? "Officer" : "Farmer"}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="mt-5 space-y-3">
            {tab === "signup" && mode === "farmer" && (
              <>
                <Field icon={UserIcon} label="Full name" value={name} onChange={setName} placeholder="Ramesh Kumar" />
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={Phone} label="Phone" value={phone} onChange={setPhone} placeholder="98XXXXXXXX" />
                  <Field icon={MapPin} label="Village" value={village} onChange={setVillage} placeholder="Village" />
                </div>
                <Field icon={MapPin} label="District" value={district} onChange={setDistrict} placeholder="District" />
              </>
            )}
            <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Please wait…" : tab === "signup" ? "Create account & continue" : "Sign in"}
            </Button>

            {mode === "farmer" && (
              <button type="button" onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
                className="w-full text-xs text-primary underline-offset-2 hover:underline">
                {tab === "signin" ? "New farmer? Create an account" : "Already registered? Sign in"}
              </button>
            )}

            {mode === "officer" && (
              <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">Demo credentials pre-filled</div>
                <div className="mt-0.5">First login auto-creates the admin account.</div>
              </div>
            )}
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Government-grade · End-to-end encrypted
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required
          className="pl-9" />
      </div>
    </div>
  );
}
