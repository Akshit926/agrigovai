import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sprout, ShieldCheck, Brain, Satellite, FileCheck2, MessageSquare, BarChart3,
  ArrowRight, CheckCircle2, Users, Building2, Phone, Mail, MapPin,
  Sparkles, TrendingUp, Activity, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriGov AI — Smart Agriculture Administration · Government of India" },
      { name: "description", content: "AI-powered platform for the Department of Agriculture & Farmers Welfare. Apply for schemes, file grievances, detect fraud, and run district-level analytics." },
      { property: "og:title", content: "AgriGov AI — Smart Agriculture Administration" },
      { property: "og:description", content: "AI-powered agriculture administration for farmers and officers across India." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, role, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (user) return <Navigate to={role === "farmer" ? "/farmer" : "/dashboard"} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg text-primary-foreground shadow-md" style={{ background: "var(--gradient-hero)" }}>
              <Sprout className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight">{t("app.name")}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.tagline")}</div>
            </div>
          </Link>
          <nav className="ml-8 hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#features" className="hover:text-primary">{t("landing.features")}</a>
            <a href="#schemes" className="hover:text-primary">{t("landing.schemes")}</a>
            <a href="#how" className="hover:text-primary">{t("landing.how")}</a>
            <a href="#contact" className="hover:text-primary">{t("landing.contact")}</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login" className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">{t("app.sign_in")}</Link>
            <Link to="/login" className="hidden rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-95 sm:inline-flex">{t("app.register")}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(circle at 15% 20%, white 0, transparent 35%), radial-gradient(circle at 85% 80%, white 0, transparent 35%)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 text-primary-foreground lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3 w-3" /> {t("landing.hero_badge")}
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing.hero_title")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
              {t("landing.hero_desc")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg hover:bg-white/95">
                Farmer Login / Register <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20">
                <ShieldCheck className="h-4 w-4" /> Officer Sign In
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-white/85">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Aadhaar-grade security</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 6 active schemes</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 5 AI engines online</span>
            </div>
          </motion.div>

          {/* Live console preview card */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-white/25 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs text-white/85">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live AI Console
              <span className="ml-auto text-white/60">v2.4</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-foreground">
              <PreviewStat icon={FileText} label="Applications" value="1,284" trend="+12%" />
              <PreviewStat icon={ShieldCheck} label="Fraud Caught" value="37" trend="this week" />
              <PreviewStat icon={MessageSquare} label="Grievances" value="146" trend="92% resolved" />
              <PreviewStat icon={TrendingUp} label="Avg. Decision" value="4.2 hrs" trend="−68% vs manual" />
            </div>
            <div className="mt-4 rounded-xl bg-white p-3 text-foreground shadow">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-primary">
                <Activity className="h-3.5 w-3.5" /> AI ENGINE LOG
              </div>
              <ul className="mt-2 space-y-1.5 text-[11px]">
                <LogLine tone="ok" text="PM-KISAN · Application APP-1287 — documents verified" />
                <LogLine tone="warn" text="PMFBY · APP-1286 — missing land record (7/12)" />
                <LogLine tone="danger" text="Soil Health · APP-1284 — duplicate land ID flagged" />
                <LogLine tone="ok" text="Grievance G-0419 classified: Subsidy / Payment · HIGH" />
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4">
          {[
            { v: "60+", l: "Registered farmers (demo)" },
            { v: "120+", l: "Applications processed" },
            { v: "6", l: "Government schemes" },
            { v: "99.2%", l: "AI uptime" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">{s.v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <SectionHeader eyebrow="Capabilities" title="One platform · Five AI engines"
          subtitle="Built for the workflows of the Department of Agriculture — from a farmer's first application to a district officer's monthly report." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FileCheck2, title: "Document AI", desc: "Auto-detects missing or invalid documents the moment a farmer submits — no back-and-forth." },
            { icon: ShieldCheck, title: "Fraud Detection", desc: "Flags duplicate land claims, oversized areas and repeat applicants with explainable risk scores." },
            { icon: Satellite, title: "Field Verification", desc: "NDVI + regional crop modelling validates claims remotely, reducing on-ground inspections." },
            { icon: MessageSquare, title: "Grievance NLP", desc: "Classifies, prioritises and routes complaints to the correct desk in seconds." },
            { icon: BarChart3, title: "Demand Forecasting", desc: "Predicts scheme uptake by district so subsidies and inputs are pre-allocated where they're needed." },
            { icon: Brain, title: "Decision Co-pilot", desc: "Surfaces every input — area, history, anomalies — so officers approve in one click with full audit trail." },
          ].map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* Schemes */}
      <section id="schemes" className="border-y border-border bg-secondary/40 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader eyebrow="Schemes" title="Apply for 6 flagship government schemes"
            subtitle="All in one place — no juggling between portals, paper forms or office visits." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { code: "PM-KISAN", name: "PM Kisan Samman Nidhi", desc: "Direct income support of ₹6,000/year to small & marginal farmers." },
              { code: "PMFBY", name: "Pradhan Mantri Fasal Bima Yojana", desc: "Crop insurance against natural calamities, pests and disease." },
              { code: "PMKSY", name: "PM Krishi Sinchayee Yojana", desc: "Drip & sprinkler irrigation subsidies for water efficiency." },
              { code: "SHC", name: "Soil Health Card Scheme", desc: "Free soil testing & nutrient recommendations every 2 years." },
              { code: "KCC", name: "Kisan Credit Card", desc: "Short-term credit for cultivation at concessional interest." },
              { code: "RKVY", name: "Rashtriya Krishi Vikas Yojana", desc: "Infrastructure & equipment grants for agricultural development." },
            ].map((s) => (
              <div key={s.code} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-primary-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">{s.code}</span>
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="mt-3 text-base font-semibold">{s.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                <Link to="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Apply now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <SectionHeader eyebrow="How it works" title="From application to approval in hours, not weeks"
          subtitle="A transparent four-step pipeline shared by farmers and officers." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Register", d: "Farmer signs up with phone & village. Officers log in with department credentials." },
            { n: "02", t: "Apply", d: "Choose scheme · enter land & crop · upload documents. Live AI feedback as you type." },
            { n: "03", t: "AI Review", d: "Documents, fraud, NDVI checked instantly. Priority score assigned." },
            { n: "04", t: "Decision", d: "Officer reviews queue, approves, requests info — farmer is notified." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="text-[11px] font-bold tracking-wider text-primary">{s.n}</div>
              <div className="mt-1 text-base font-semibold">{s.t}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Two CTAs */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          <CTA tone="primary" icon={Users} title="I am a Farmer"
            desc="Apply for schemes, track your applications and file grievances — anytime, anywhere."
            cta="Register / Sign in as Farmer" />
          <CTA tone="accent" icon={Building2} title="I am an Officer"
            desc="Access the AI-powered admin console: applications, fraud, field verification, analytics and reports."
            cta="Officer Sign In" />
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                  <Sprout className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold">AgriGov AI</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dept. of Agriculture</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Smart Agriculture Administration platform — Government of India initiative.</p>
            </div>
            <FooterCol title="Platform" links={["Features", "Schemes", "How it works", "Officer Console"]} />
            <FooterCol title="Resources" links={["User Guide", "Helpline", "FAQ", "Privacy Policy"]} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">Contact</div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> 1800-180-1551 (Toll-free)</li>
                <li className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> support@agrigov.ai</li>
                <li className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> Krishi Bhavan, New Delhi 110001</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} AgriGov AI · Government of India · All rights reserved.</span>
            <span>Best viewed on Chrome, Firefox & Edge · WCAG 2.1 AA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-[11px] font-bold uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
      className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

function CTA({ tone, icon: Icon, title, desc, cta }: { tone: "primary" | "accent"; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; cta: string }) {
  const bg = tone === "primary" ? "var(--gradient-hero)" : "linear-gradient(135deg, var(--accent), var(--primary))";
  return (
    <Link to="/login" className="group relative overflow-hidden rounded-2xl p-7 text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
      style={{ background: bg }}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-bold">{title}</div>
          <p className="mt-1 text-sm text-white/90">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-primary group-hover:bg-white/95">
            {cta} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PreviewStat({ icon: Icon, label, value, trend }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; trend: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{trend}</span>
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function LogLine({ tone, text }: { tone: "ok" | "warn" | "danger"; text: string }) {
  const cls = tone === "ok" ? "bg-success" : tone === "warn" ? "bg-warning" : "bg-destructive";
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${cls}`} />
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
        {links.map((l) => <li key={l}><a href="#" className="hover:text-primary">{l}</a></li>)}
      </ul>
    </div>
  );
}
