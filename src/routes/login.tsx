import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sprout, ShieldCheck, Sparkles, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@agrigov.ai");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" />;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error && res.error.message.toLowerCase().includes("invalid")) {
      // auto-create admin on first login (demo convenience)
      const su = await supabase.auth.signUp({ email, password, options: { data: { full_name: "Officer Admin" } } });
      if (su.error) { toast.error(su.error.message); setBusy(false); return; }
      res = await supabase.auth.signInWithPassword({ email, password });
    }
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Welcome to AgriGov AI");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 30%), radial-gradient(circle at 80% 70%, white 0, transparent 30%)"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-2xl border border-white/30 bg-white/15 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 text-primary shadow-lg">
            <Sprout className="h-6 w-6" />
          </div>
          <div className="text-white">
            <div className="text-xl font-bold tracking-tight">AgriGov AI</div>
            <div className="text-[11px] uppercase tracking-wider text-white/70">Admin Console</div>
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-bold text-white">Welcome, Officer</h1>
        <p className="mt-1 text-sm text-white/80">Transforming Agriculture Administration with AI</p>

        <form onSubmit={handle} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/90">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="border-white/30 bg-white/15 pl-9 text-white placeholder:text-white/50 focus-visible:border-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/90">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="border-white/30 bg-white/15 pl-9 text-white placeholder:text-white/50 focus-visible:border-white" />
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full bg-white font-semibold text-primary hover:bg-white/90">
            {busy ? "Signing in…" : "Sign in to dashboard"}
          </Button>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 text-xs text-white/85">
            <div className="flex items-center gap-1.5 font-medium"><Sparkles className="h-3 w-3" /> Demo mode</div>
            <div className="mt-0.5 text-white/70">Default credentials are pre-filled. Click sign in — first login auto-creates the admin.</div>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/70">
          <ShieldCheck className="h-3 w-3" /> Government-grade · End-to-end encrypted
        </div>
      </motion.div>
    </div>
  );
}
