import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sprout, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid phone"),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

function AuthPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!loading && user && role) {
    return <Navigate to={role === "admin" ? "/admin" : "/farmer"} />;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You're signed in.");
    navigate({ to: "/farmer" });
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <div
        className="hidden flex-1 flex-col justify-between p-12 text-primary-foreground sm:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="text-base font-bold">AgriGov AI</div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Empowering farmers.<br />Equipping officers.
          </h2>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/80">
            Apply for schemes, track approvals, and raise grievances — all in one secure place.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs text-primary-foreground/80">
            <ShieldCheck className="h-4 w-4" /> Secure, encrypted, government-grade.
          </div>
        </div>
        <div className="text-xs text-primary-foreground/70">© AgriGov AI · Pilot</div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Welcome to AgriGov AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in or create an account as a farmer.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <Field label="Email" name="email" type="email" placeholder="you@example.com" />
                <Field label="Password" name="password" type="password" placeholder="••••••••" />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <Field label="Full name" name="fullName" placeholder="Ramesh Kumar" />
                <Field label="Phone" name="phone" placeholder="+919876543210" />
                <Field label="Email" name="email" type="email" placeholder="you@example.com" />
                <Field label="Password" name="password" type="password" placeholder="At least 8 characters" />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create farmer account"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Officer access is provisioned by the ministry. Contact your district administrator.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required />
    </div>
  );
}
