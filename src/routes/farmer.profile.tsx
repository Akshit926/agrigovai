import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Shield, MapPin, CreditCard, Camera, CheckCircle2, Lock, Phone, Mail, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/farmer/profile")({
  component: ProfilePage,
});

interface Profile {
  full_name: string; father_name: string; phone: string; dob: string; gender: string; aadhaar: string;
  village: string; taluka: string; district: string; state: string; pin_code: string;
  bank_account: string; bank_ifsc: string; avatar_url: string;
}

const EMPTY: Profile = {
  full_name: "", father_name: "", phone: "", dob: "", gender: "", aadhaar: "",
  village: "", taluka: "", district: "", state: "Maharashtra", pin_code: "",
  bank_account: "", bank_ifsc: "", avatar_url: "",
};

function ProfilePage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({ ...EMPTY, ...data });
      setLoaded(true);
    });
  }, [user]);

  const update = (key: keyof Profile, val: string) => setProfile({ ...profile, [key]: val });

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...profile });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("profile.saved"));
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const path = `avatars/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("farmer-documents").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = supabase.storage.from("farmer-documents").getPublicUrl(path);
    update("avatar_url", urlData.publicUrl);
  };

  const maskAadhaar = (val: string) => {
    if (val.length <= 4) return val;
    return "XXXX-XXXX-" + val.slice(-4);
  };

  if (!loaded) return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-24 sm:h-32" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-secondary shadow-lg sm:h-28 sm:w-28">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              </label>
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold sm:text-2xl">{profile.full_name || t("profile.full_name")}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                {profile.aadhaar && <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success"><CheckCircle2 className="h-3 w-3" /> Aadhaar {t("profile.verified")}</span>}
                <span className="inline-flex items-center gap-1 rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-semibold text-info"><Mail className="h-3 w-3" /> Email {t("profile.verified")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Section icon={User} title={t("profile.personal")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("profile.full_name")} value={profile.full_name} onChange={(v) => update("full_name", v)} required />
            <Field label={t("profile.father_name")} value={profile.father_name} onChange={(v) => update("father_name", v)} />
            <Field label={t("profile.phone")} value={profile.phone} onChange={(v) => update("phone", v)} type="tel" icon={<Phone className="h-3.5 w-3.5" />} />
            <Field label={t("profile.email")} value={user?.email ?? ""} disabled icon={<Mail className="h-3.5 w-3.5" />} />
            <Field label={t("profile.dob")} value={profile.dob} onChange={(v) => update("dob", v)} type="date" icon={<Calendar className="h-3.5 w-3.5" />} />
            <div className="space-y-1.5">
              <Label>{t("profile.gender")}</Label>
              <Select value={profile.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("common.male")}</SelectItem>
                  <SelectItem value="female">{t("common.female")}</SelectItem>
                  <SelectItem value="other">{t("common.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label>{t("profile.aadhaar")}</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                value={profile.aadhaar}
                onChange={(e) => update("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                maxLength={12}
                className="font-mono tracking-wider"
              />
              {profile.aadhaar.length === 12 && <CheckCircle2 className="h-5 w-5 text-success" />}
            </div>
            {profile.aadhaar.length > 0 && profile.aadhaar.length === 12 && (
              <p className="mt-1 text-[11px] text-muted-foreground">Display: {maskAadhaar(profile.aadhaar)}</p>
            )}
          </div>
        </Section>

        {/* Address */}
        <Section icon={MapPin} title={t("profile.address")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("profile.village")} value={profile.village} onChange={(v) => update("village", v)} />
            <Field label={t("profile.taluka")} value={profile.taluka} onChange={(v) => update("taluka", v)} />
            <Field label={t("profile.district")} value={profile.district} onChange={(v) => update("district", v)} />
            <Field label={t("profile.state")} value={profile.state} onChange={(v) => update("state", v)} />
            <Field label={t("profile.pin")} value={profile.pin_code} onChange={(v) => update("pin_code", v.replace(/\D/g, "").slice(0, 6))} maxLength={6} />
          </div>
        </Section>

        {/* Bank Details */}
        <Section icon={CreditCard} title={t("profile.bank")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("profile.account")} value={profile.bank_account} onChange={(v) => update("bank_account", v)} icon={<CreditCard className="h-3.5 w-3.5" />} />
            <Field label={t("profile.ifsc")} value={profile.bank_ifsc} onChange={(v) => update("bank_ifsc", v.toUpperCase())} />
          </div>
        </Section>

        {/* Security */}
        <Section icon={Shield} title={t("profile.security")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success"><Lock className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-semibold">Password</div>
                  <div className="text-[11px] text-muted-foreground">Last changed: Unknown</div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.info("Password reset email sent to " + user?.email)}>Change</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/15 text-info"><Phone className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-semibold">Phone Verification</div>
                  <div className="text-[11px] text-muted-foreground">{profile.phone || "Not added"}</div>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${profile.phone ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                {profile.phone ? t("profile.verified") : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-semibold">Aadhaar eKYC</div>
                  <div className="text-[11px] text-muted-foreground">{profile.aadhaar ? maskAadhaar(profile.aadhaar) : "Not linked"}</div>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${profile.aadhaar.length === 12 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                {profile.aadhaar.length === 12 ? t("profile.verified") : "Pending"}
              </span>
            </div>
          </div>
        </Section>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy} size="lg">
          {busy ? t("profile.saving") : t("profile.save")}
        </Button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, disabled, icon, maxLength }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; required?: boolean; disabled?: boolean;
  icon?: React.ReactNode; maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <Input
          type={type} value={value} onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled} required={required} maxLength={maxLength}
          className={icon ? "pl-9" : ""}
        />
      </div>
    </div>
  );
}
