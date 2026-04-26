import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Sprout, ShieldCheck, Satellite, MessageSquare, BarChart3, FileCheck2, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, role, loading } = useAuth();
  if (!loading && user && role) {
    return <Navigate to={role === "admin" ? "/admin" : "/farmer"} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--primary) 0, transparent 40%), radial-gradient(circle at 80% 60%, var(--accent) 0, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Pilot · Ministry of Agriculture
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Smart agriculture<br />
                <span className="text-primary">administration, simplified.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                AgriGov AI helps farmers apply for schemes and file grievances in minutes — and
                helps officers process applications, detect duplicates and route complaints in seconds.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">
                    Explore features
                  </Button>
                </a>
              </div>
              <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
                <Stat value="80%" label="Less paperwork" />
                <Stat value="<5d" label="Avg. approval" />
                <Stat value="6" label="Live schemes" />
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-elevated)]">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Sprout className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Officer Dashboard</div>
                      <div className="text-xs text-muted-foreground">Live preview</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
                    24 today
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <PreviewCard icon={<FileCheck2 className="h-4 w-4 text-primary" />} value="142" label="Applications" />
                  <PreviewCard icon={<ShieldCheck className="h-4 w-4 text-warning" />} value="7" label="Fraud flags" />
                  <PreviewCard icon={<MessageSquare className="h-4 w-4 text-info" />} value="38" label="Grievances" />
                  <PreviewCard icon={<BarChart3 className="h-4 w-4 text-accent" />} value="↑12%" label="This week" />
                </div>
                <div className="mt-4 space-y-2">
                  <PreviewRow name="Ramesh K." scheme="PM-KISAN" status="Approved" tone="success" />
                  <PreviewRow name="Suman D." scheme="PMFBY" status="Docs missing" tone="warn" />
                  <PreviewRow name="Anil P." scheme="KCC" status="Fraud check" tone="danger" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            One platform. Both sides served.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for the realities of district agriculture offices and the farmers they serve.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<FileCheck2 className="h-5 w-5" />}
            title="Document AI"
            text="Auto-checks applications for missing documents and instantly returns incomplete ones to farmers."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Fraud & Duplicate Detection"
            text="Flags same-land claims, duplicate Aadhaar use, and implausible plot sizes before approval."
          />
          <Feature
            icon={<Satellite className="h-5 w-5" />}
            title="Field Verification (Coming)"
            text="Compares claimed crops against satellite NDVI signatures — no more wasted field trips."
          />
          <Feature
            icon={<MessageSquare className="h-5 w-5" />}
            title="Grievance Classification"
            text="Auto-tags complaints by category and urgency so urgent cases never sit in an inbox."
          />
          <Feature
            icon={<BarChart3 className="h-5 w-5" />}
            title="Demand Insights"
            text="See pending workload, fraud trends and scheme uptake at a glance — make data-driven calls."
          />
          <Feature
            icon={<Sprout className="h-5 w-5" />}
            title="Built for farmers"
            text="Mobile-first, simple language, transparent status — track every application in real time."
          />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AgriGov AI · A pilot initiative
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PreviewCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function PreviewRow({ name, scheme, status, tone }: { name: string; scheme: string; status: string; tone: "success" | "warn" | "danger" }) {
  const toneCls =
    tone === "success" ? "bg-success/10 text-success" :
    tone === "warn" ? "bg-warning/15 text-warning" :
    "bg-destructive/10 text-destructive";
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs">
      <div>
        <div className="font-medium text-foreground">{name}</div>
        <div className="text-muted-foreground">{scheme}</div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${toneCls}`}>{status}</span>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-elevated)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
