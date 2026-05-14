import { getChatResponse } from "@/lib/chatbot";
import { supabase } from "@/integrations/supabase/client";

// AgriIntel AI — Smart admin assistant that queries live data
export async function getAgriIntelResponse(query: string): Promise<string> {
  const q = query.toLowerCase().trim();

  // Fetch live data
  const [appsRes, grieRes] = await Promise.all([
    supabase.from("applications").select("id, status, crop, area_acres, land_id, priority_score, created_at, ai_fraud, ai_completeness, scheme:schemes(name, code), profile:profiles(full_name, village, district, taluka)").order("created_at", { ascending: false }),
    supabase.from("grievances").select("id, subject, description, ai_category, priority, status, created_at, admin_response, profile:profiles(full_name, village, district)").order("created_at", { ascending: false }),
  ]);
  const apps = (appsRes.data ?? []) as any[];
  const grievances = (grieRes.data ?? []) as any[];

  const total = apps.length;
  const pending = apps.filter((a: any) => ["submitted", "under_review"].includes(a.status)).length;
  const approved = apps.filter((a: any) => a.status === "approved").length;
  const rejected = apps.filter((a: any) => a.status === "rejected").length;
  const fraudFlagged = apps.filter((a: any) => a.ai_fraud?.flagged).length;
  const docsIncomplete = apps.filter((a: any) => a.status === "docs_incomplete").length;
  const highPriority = apps.filter((a: any) => a.priority_score >= 60).length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  const totalGriev = grievances.length;
  const openGriev = grievances.filter((g: any) => g.status === "open").length;
  const highGriev = grievances.filter((g: any) => g.priority === "high" && g.status !== "resolved").length;
  const resolvedGriev = grievances.filter((g: any) => g.status === "resolved" || g.status === "closed").length;

  // Duplicate land detection
  const landMap: Record<string, string[]> = {};
  apps.forEach((a: any) => { if (!landMap[a.land_id]) landMap[a.land_id] = []; landMap[a.land_id].push(a.profile?.full_name || "Unknown"); });
  const duplicateLands = Object.entries(landMap).filter(([, v]) => v.length > 1);

  // District stats
  const districtStats: Record<string, { total: number; approved: number; fraud: number; pending: number }> = {};
  apps.forEach((a: any) => {
    const d = a.profile?.district || "Unknown";
    if (!districtStats[d]) districtStats[d] = { total: 0, approved: 0, fraud: 0, pending: 0 };
    districtStats[d].total++;
    if (a.status === "approved") districtStats[d].approved++;
    if (a.ai_fraud?.flagged) districtStats[d].fraud++;
    if (["submitted", "under_review"].includes(a.status)) districtStats[d].pending++;
  });

  // Scheme stats
  const schemeStats: Record<string, number> = {};
  apps.forEach((a: any) => { const s = a.scheme?.name || "Unknown"; schemeStats[s] = (schemeStats[s] ?? 0) + 1; });
  const topSchemes = Object.entries(schemeStats).sort(([, a], [, b]) => b - a);

  // Delayed apps (>14 days)
  const delayed = apps.filter((a: any) => {
    const days = (Date.now() - new Date(a.created_at).getTime()) / 86400000;
    return days > 14 && !["approved", "rejected"].includes(a.status);
  });

  // Pattern matching for queries
  if (q.includes("summary") || q.includes("overview") || q.includes("status") || q === "help") {
    return `📊 **AgriGov AI Platform Summary**\n\n` +
      `**Applications:** ${total} total | ${pending} pending | ${approved} approved | ${rejected} rejected\n` +
      `**Approval Rate:** ${approvalRate}%\n` +
      `**Fraud Alerts:** ${fraudFlagged} flagged applications\n` +
      `**Missing Docs:** ${docsIncomplete} incomplete\n` +
      `**High Priority:** ${highPriority} applications (score ≥60)\n` +
      `**Delayed:** ${delayed.length} applications (>14 days)\n\n` +
      `**Grievances:** ${totalGriev} total | ${openGriev} open | ${highGriev} high priority | ${resolvedGriev} resolved\n\n` +
      `**Duplicate Land IDs:** ${duplicateLands.length} detected`;
  }

  if (q.includes("high risk") || q.includes("high-risk") || q.includes("fraud")) {
    const flagged = apps.filter((a: any) => a.ai_fraud?.flagged).slice(0, 5);
    if (flagged.length === 0) return "✅ No high-risk or fraud-flagged applications found in the current data.";
    let resp = `🚨 **${fraudFlagged} Fraud Alerts Detected**\n\n`;
    flagged.forEach((a: any) => {
      resp += `• **${a.profile?.full_name}** (${a.profile?.district}) — ${a.scheme?.name}\n  Risk: ${a.ai_fraud?.riskScore}/100 | Reason: ${a.ai_fraud?.reasons?.join(", ") || "Suspicious pattern"}\n\n`;
    });
    resp += `\nRecommendation: Review these applications in the Fraud Detection module.`;
    return resp;
  }

  if (q.includes("pending") || q.includes("approval")) {
    const district = extractDistrict(q, Object.keys(districtStats));
    const filtered = district ? apps.filter((a: any) => a.profile?.district === district && ["submitted", "under_review"].includes(a.status)) : apps.filter((a: any) => ["submitted", "under_review"].includes(a.status));
    const label = district || "all districts";
    if (filtered.length === 0) return `✅ No pending applications in ${label}.`;
    let resp = `📋 **${filtered.length} Pending Applications** in ${label}\n\n`;
    filtered.slice(0, 5).forEach((a: any) => {
      resp += `• **${a.profile?.full_name}** — ${a.scheme?.name} | ${a.crop} ${a.area_acres}ac | Priority: ${a.priority_score}\n`;
    });
    if (filtered.length > 5) resp += `\n...and ${filtered.length - 5} more.`;
    return resp;
  }

  if (q.includes("grievance") || q.includes("complaint")) {
    if (q.includes("unresolved") || q.includes("open") || q.includes("pending")) {
      const open = grievances.filter((g: any) => g.status === "open" || g.status === "in_progress");
      if (open.length === 0) return "✅ All grievances are resolved. Inbox clear.";
      let resp = `📨 **${open.length} Unresolved Grievances**\n\n`;
      open.slice(0, 5).forEach((g: any) => {
        resp += `• **${g.subject}** (${g.priority}) — ${g.profile?.full_name}, ${g.profile?.district}\n  Category: ${g.ai_category || "General"} | Status: ${g.status}\n\n`;
      });
      return resp;
    }
    return `📨 **Grievance Summary**\n\nTotal: ${totalGriev} | Open: ${openGriev} | High Priority: ${highGriev} | Resolved: ${resolvedGriev}\n\nRecommendation: ${highGriev > 0 ? `${highGriev} high-priority grievances need immediate attention.` : "All high-priority issues addressed."}`;
  }

  if (q.includes("duplicate") || q.includes("land id")) {
    if (duplicateLands.length === 0) return "✅ No duplicate land IDs detected in the system.";
    let resp = `⚠️ **${duplicateLands.length} Duplicate Land IDs Found**\n\n`;
    duplicateLands.slice(0, 5).forEach(([land, farmers]) => {
      resp += `• Land ID **${land}** — claimed by: ${farmers.join(", ")} (${farmers.length}x)\n`;
    });
    resp += `\nRecommendation: Cross-verify these with Bhulekh 7/12 records.`;
    return resp;
  }

  if (q.includes("district") || q.includes("analytics") || q.includes("performance")) {
    const district = extractDistrict(q, Object.keys(districtStats));
    if (district && districtStats[district]) {
      const s = districtStats[district];
      return `📊 **${district} District Analytics**\n\nTotal Applications: ${s.total}\nApproved: ${s.approved} (${Math.round(s.approved / Math.max(s.total, 1) * 100)}%)\nPending: ${s.pending}\nFraud Alerts: ${s.fraud}\n\nPerformance: ${s.approved / Math.max(s.total, 1) > 0.7 ? "Excellent" : s.approved / Math.max(s.total, 1) > 0.5 ? "Good" : "Needs improvement"}`;
    }
    let resp = `📊 **District-wise Performance**\n\n`;
    Object.entries(districtStats).sort(([, a], [, b]) => b.total - a.total).slice(0, 8).forEach(([name, s]) => {
      resp += `• **${name}**: ${s.total} apps | ${s.approved} approved | ${s.fraud} flagged | ${s.pending} pending\n`;
    });
    return resp;
  }

  if (q.includes("scheme") || q.includes("demand") || q.includes("popular")) {
    if (topSchemes.length === 0) return "No scheme data available yet.";
    let resp = `📈 **Scheme Demand Analysis**\n\n`;
    topSchemes.slice(0, 6).forEach(([name, count], i) => {
      resp += `${i + 1}. **${name}** — ${count} applications (${Math.round(count / Math.max(total, 1) * 100)}%)\n`;
    });
    resp += `\nMost popular: **${topSchemes[0][0]}** with ${topSchemes[0][1]} applications.`;
    return resp;
  }

  if (q.includes("delay") || q.includes("overdue")) {
    if (delayed.length === 0) return "✅ No delayed applications. All applications are within the processing timeline.";
    let resp = `⏰ **${delayed.length} Delayed Applications** (>14 days pending)\n\n`;
    delayed.slice(0, 5).forEach((a: any) => {
      const days = Math.round((Date.now() - new Date(a.created_at).getTime()) / 86400000);
      resp += `• **${a.profile?.full_name}** — ${a.scheme?.name} | ${days} days old | Priority: ${a.priority_score}\n`;
    });
    resp += `\nRecommendation: Expedite review for these applications.`;
    return resp;
  }

  if (q.includes("report") || q.includes("generate")) {
    return `📄 **Quick Report — ${new Date().toLocaleDateString()}**\n\n` +
      `**Applications:** ${total} total | ${approvalRate}% approval rate\n` +
      `**This week:** ${apps.filter((a: any) => (Date.now() - new Date(a.created_at).getTime()) < 7 * 86400000).length} new applications\n` +
      `**Fraud:** ${fraudFlagged} alerts | ${duplicateLands.length} duplicate land IDs\n` +
      `**Grievances:** ${totalGriev} total | ${openGriev} open | ${highGriev} urgent\n` +
      `**Top District:** ${Object.entries(districtStats).sort(([, a], [, b]) => b.total - a.total)[0]?.[0] || "—"}\n` +
      `**Top Scheme:** ${topSchemes[0]?.[0] || "—"}\n\n` +
      `Recommendation: ${highGriev > 0 ? "Address high-priority grievances first." : fraudFlagged > 0 ? "Review fraud alerts." : "All systems operating normally."}`;
  }

  // Fallback — general AI response
  return `I can help you with:\n\n` +
    `• **"summary"** — Full platform overview\n` +
    `• **"pending in [district]"** — Pending applications\n` +
    `• **"fraud alerts"** — High-risk applications\n` +
    `• **"unresolved grievances"** — Open complaints\n` +
    `• **"duplicate land IDs"** — Duplicate detection\n` +
    `• **"district analytics"** — District performance\n` +
    `• **"scheme demand"** — Scheme popularity\n` +
    `• **"delayed applications"** — Overdue applications\n` +
    `• **"generate report"** — Quick daily report\n\n` +
    `Try asking something specific about your administration data.`;
}

function extractDistrict(query: string, districts: string[]): string | null {
  for (const d of districts) {
    if (query.toLowerCase().includes(d.toLowerCase())) return d;
  }
  return null;
}
