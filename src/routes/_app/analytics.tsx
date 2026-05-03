import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./dashboard";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

interface AppRow { status: string; crop: string; area_acres: number; created_at: string; scheme: { name: string; category: string } | null; profile: { district: string | null } | null }

function AnalyticsPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("applications").select("status, crop, area_acres, created_at, scheme:schemes(name, category), profile:profiles!inner(district)");
      setApps((data ?? []) as unknown as AppRow[]);
    })();
  }, []);

  // 30 day trend
  const days: { date: string; submitted: number; approved: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(5, 10);
    days.push({ date: k, submitted: 0, approved: 0 });
  }
  apps.forEach((a) => {
    const k = a.created_at.slice(5, 10);
    const day = days.find((x) => x.date === k);
    if (day) {
      day.submitted++;
      if (a.status === "approved") day.approved++;
    }
  });

  // Crops
  const crops: Record<string, number> = {};
  apps.forEach((a) => { crops[a.crop] = (crops[a.crop] ?? 0) + 1; });
  const cropData = Object.entries(crops).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Districts
  const districts: Record<string, number> = {};
  apps.forEach((a) => { const d = a.profile?.district ?? "—"; districts[d] = (districts[d] ?? 0) + 1; });
  const districtData = Object.entries(districts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Categories
  const cats: Record<string, number> = {};
  apps.forEach((a) => { const c = a.scheme?.category ?? "—"; cats[c] = (cats[c] ?? 0) + 1; });
  const catData = Object.entries(cats).map(([name, value]) => ({ name, value }));

  // Demand prediction (simple linear regression on last 14 days)
  const last14 = days.slice(-14);
  const n = last14.length;
  const xs = last14.map((_, i) => i);
  const ys = last14.map((d) => d.submitted);
  const xm = xs.reduce((a, b) => a + b) / n;
  const ym = ys.reduce((a, b) => a + b) / n;
  const slope = xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0) / xs.reduce((s, x) => s + (x - xm) ** 2, 0);
  const intercept = ym - slope * xm;
  const forecast: { date: string; actual: number | null; forecast: number | null }[] = last14.map((d) => ({ date: d.date, actual: d.submitted, forecast: null }));
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    forecast.push({ date: d.toISOString().slice(5, 10), actual: null, forecast: Math.max(0, Math.round(intercept + slope * (n - 1 + i))) });
  }

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time intelligence on demand, approvals, regions and crops.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Applications: Submitted vs Approved (30d)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={days}>
              <defs>
                <linearGradient id="sub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="app" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="submitted" stroke="var(--primary)" fill="url(#sub)" strokeWidth={2} />
              <Area type="monotone" dataKey="approved" stroke="var(--accent)" fill="url(#app)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Demand Prediction (next 7 days)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="forecast" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Crop Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cropData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Region-wise Applications">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Scheme Categories">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 10 }}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
