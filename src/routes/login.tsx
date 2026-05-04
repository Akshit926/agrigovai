import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sprout, ShieldCheck, Sparkles, Mail, Lock, User as UserIcon, Phone, MapPin } from "lucide-react";
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
  const [email, setEmail] = useState("admin@agrigov.ai");
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
    if (m === "officer") { setEmail("admin@agrigov.ai"); setPassword("admin123"); }
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

    let res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error && mode === "officer" && res.error.message.toLowerCase().includes("invalid")) {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 30%), radial-gradient(circle at 80% 70%, white 0, transparent 30%)"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white/15 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 text-primary shadow-lg">
            <Sprout className="h-6 w-6" />
          </div>
          <div className="text-white">
            <div className="text-xl font-bold tracking-tight">AgriGov AI</div>
            <div className="text-[11px] uppercase tracking-wider text-white/70">Government of India · Dept. of Agriculture</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-white/10 p-1">
          {(["officer", "farmer"] as Mode[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)} type="button"
              className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${mode === m ? "bg-white text-primary shadow" : "text-white/85 hover:bg-white/10"}`}>
              {m === "officer" ? "Officer" : "Farmer"}
            </button>
          ))}
        </div>

        <h1 className="mt-5 text-xl font-bold text-white">
          {mode === "officer" ? "Officer Sign In" : tab === "signup" ? "Create Farmer Account" : "Farmer Sign In"}
        </h1>
        <p className="mt-1 text-xs text-white/80">
          {mode === "officer" ? "Restricted access · administration console" : "Apply for schemes, file grievances, track applications"}
        </p>

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

          <Button type="submit" disabled={busy} className="w-full bg-white font-semibold text-primary hover:bg-white/90">
            {busy ? "Please wait…" : tab === "signup" ? "Create account & continue" : "Sign in"}
          </Button>

          {mode === "farmer" && (
            <button type="button" onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
              className="w-full text-xs text-white/85 underline-offset-2 hover:underline">
              {tab === "signin" ? "New farmer? Create an account" : "Already registered? Sign in"}
            </button>
          )}

          {mode === "officer" && (
            <div className="rounded-lg border border-white/20 bg-white/10 p-3 text-xs text-white/85">
              <div className="flex items-center gap-1.5 font-medium"><Sparkles className="h-3 w-3" /> Demo officer</div>
              <div className="mt-0.5 text-white/70">Default credentials are pre-filled. First login auto-creates the admin.</div>
            </div>
          )}
        </form>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-white/70">
          <ShieldCheck className="h-3 w-3" /> Government-grade · End-to-end encrypted
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-white/85">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required
          className="border-white/30 bg-white/15 pl-9 text-white placeholder:text-white/50 focus-visible:border-white" />
      </div>
    </div>
  );
}
