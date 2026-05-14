import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Sparkles, Inbox, Droplets, ShieldCheck, Sprout as SproutIcon, FileText, Users, Tractor, MapPin, HelpCircle, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classifyGrievance } from "@/lib/ai-rules";
import { getAIImprovedText } from "@/lib/chatbot";
import { PriorityBadge } from "./farmer.index";

export const Route = createFileRoute("/farmer/grievance")({
  component: GrievancePage,
});

const CATEGORIES = [
  { id: "subsidy", label: { en: "Subsidy / Payment", hi: "सब्सिडी / भुगतान", mr: "सबसिडी / पेमेंट" }, icon: FileText, color: "bg-primary/10 text-primary" },
  { id: "insurance", label: { en: "Crop Insurance", hi: "फसल बीमा", mr: "पीक विमा" }, icon: ShieldCheck, color: "bg-success/10 text-success" },
  { id: "irrigation", label: { en: "Irrigation / Water", hi: "सिंचाई / पानी", mr: "सिंचन / पाणी" }, icon: Droplets, color: "bg-info/10 text-info" },
  { id: "seeds", label: { en: "Seeds / Inputs", hi: "बीज / इनपुट", mr: "बियाणे / निविष्ठा" }, icon: SproutIcon, color: "bg-warning/10 text-warning" },
  { id: "land", label: { en: "Land Records", hi: "भूमि रिकॉर्ड", mr: "जमीन नोंदी" }, icon: MapPin, color: "bg-accent/10 text-accent" },
  { id: "equipment", label: { en: "Equipment / Machinery", hi: "उपकरण / मशीनरी", mr: "उपकरणे / यंत्रसामग्री" }, icon: Tractor, color: "bg-destructive/10 text-destructive" },
  { id: "officer", label: { en: "Officer Conduct", hi: "अधिकारी आचरण", mr: "अधिकारी वर्तन" }, icon: Users, color: "bg-primary/10 text-primary" },
  { id: "other", label: { en: "Other", hi: "अन्य", mr: "इतर" }, icon: HelpCircle, color: "bg-muted text-muted-foreground" },
];

const CATEGORY_QUESTIONS: Record<string, { id: string; label: Record<string, string> }[]> = {
  subsidy: [
    { id: "scheme_name", label: { en: "Which scheme is this related to?", hi: "यह किस योजना से संबंधित है?", mr: "हे कोणत्या योजनेशी संबंधित आहे?" } },
    { id: "duration", label: { en: "How long has this been pending?", hi: "यह कितने समय से लंबित है?", mr: "हे किती काळापासून प्रलंबित आहे?" } },
    { id: "amount", label: { en: "What amount is involved?", hi: "कितनी राशि शामिल है?", mr: "किती रक्कम सामील आहे?" } },
  ],
  insurance: [
    { id: "claim_id", label: { en: "Claim reference number (if any)", hi: "दावा संदर्भ संख्या (यदि कोई हो)", mr: "दावा संदर्भ क्रमांक (असल्यास)" } },
    { id: "crop_type", label: { en: "Which crop was affected?", hi: "कौन सी फसल प्रभावित हुई?", mr: "कोणते पीक प्रभावित झाले?" } },
    { id: "damage_date", label: { en: "When did the damage occur?", hi: "नुकसान कब हुआ?", mr: "नुकसान कधी झाले?" } },
  ],
  irrigation: [
    { id: "source", label: { en: "What is your water source?", hi: "आपका जल स्रोत क्या है?", mr: "तुमचा पाण्याचा स्रोत कोणता आहे?" } },
    { id: "area_affected", label: { en: "How much area is affected?", hi: "कितना क्षेत्र प्रभावित है?", mr: "किती क्षेत्र प्रभावित आहे?" } },
    { id: "duration", label: { en: "Since when is the issue present?", hi: "समस्या कब से है?", mr: "समस्या कधीपासून आहे?" } },
  ],
  seeds: [
    { id: "product", label: { en: "Which product/input is involved?", hi: "कौन सा उत्पाद/इनपुट शामिल है?", mr: "कोणते उत्पादन/निविष्ठा सामील आहे?" } },
    { id: "supplier", label: { en: "Where did you purchase it?", hi: "आपने इसे कहाँ से खरीदा?", mr: "तुम्ही ते कुठून विकत घेतले?" } },
    { id: "quantity", label: { en: "What quantity was affected?", hi: "कितनी मात्रा प्रभावित हुई?", mr: "किती प्रमाण प्रभावित झाले?" } },
  ],
  land: [
    { id: "survey_no", label: { en: "Land Survey / 7/12 number", hi: "भूमि सर्वे / 7/12 नंबर", mr: "जमीन सर्वे / 7/12 क्रमांक" } },
    { id: "dispute_type", label: { en: "Type of dispute", hi: "विवाद का प्रकार", mr: "वादाचा प्रकार" } },
    { id: "office_visited", label: { en: "Have you visited the taluka office?", hi: "क्या आपने तहसील कार्यालय का दौरा किया?", mr: "तुम्ही तालुका कार्यालयाला भेट दिली का?" } },
  ],
  equipment: [
    { id: "equipment_type", label: { en: "Type of equipment", hi: "उपकरण का प्रकार", mr: "उपकरणाचा प्रकार" } },
    { id: "subsidy_applied", label: { en: "Did you apply for equipment subsidy?", hi: "क्या आपने उपकरण सब्सिडी के लिए आवेदन किया?", mr: "तुम्ही उपकरण सबसिडीसाठी अर्ज केला का?" } },
    { id: "amount", label: { en: "Cost involved", hi: "शामिल लागत", mr: "सामील खर्च" } },
  ],
  officer: [
    { id: "officer_name", label: { en: "Officer name / designation (if known)", hi: "अधिकारी का नाम / पदनाम (यदि पता हो)", mr: "अधिकाऱ्याचे नाव / पदनाम (माहीत असल्यास)" } },
    { id: "office", label: { en: "Which office / department?", hi: "कौन सा कार्यालय / विभाग?", mr: "कोणते कार्यालय / विभाग?" } },
    { id: "date", label: { en: "When did this occur?", hi: "यह कब हुआ?", mr: "हे कधी झाले?" } },
  ],
  other: [
    { id: "related_to", label: { en: "What is this related to?", hi: "यह किससे संबंधित है?", mr: "हे कशाशी संबंधित आहे?" } },
    { id: "attempts", label: { en: "What steps have you taken so far?", hi: "अब तक आपने क्या कदम उठाए हैं?", mr: "तुम्ही आतापर्यंत कोणती पावले उचलली?" } },
  ],
};

interface Row { id: string; subject: string; description: string; ai_category: string | null; priority: string; status: string; admin_response: string | null; created_at: string }

function GrievancePage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { add: addNotif } = useNotifications();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [showForm, setShowForm] = useState(true);

  const ai = useMemo(() => classifyGrievance(`${subject} ${desc}`), [subject, desc]);
  const questions = CATEGORY_QUESTIONS[category] ?? [];

  const load = () => {
    if (!user) return;
    supabase.from("grievances").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setRows((data ?? []) as Row[]));
  };
  useEffect(load, [user]);

  const improveText = () => {
    const improved = getAIImprovedText(desc, lang);
    if (improved !== desc) { setDesc(improved); toast.success("Statement improved by AI"); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || !subject || !desc) return;
    setBusy(true);
    const { error } = await supabase.from("grievances").insert({
      farmer_id: user.id, subject,
      description: `[Category: ${category}]\n${questions.map((q) => `${q.label.en}: ${questionAnswers[q.id] || "—"}`).join("\n")}\n\n${desc}`,
      ai_category: ai.category, priority: ai.priority as never,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("griev.success"));
    addNotif({ type: "success", title: t("notif.griev_filed"), message: subject });
    setCategory(""); setSubject(""); setDesc(""); setQuestionAnswers({});
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h1 className="text-lg font-bold">{t("griev.title")}</h1>
          </div>
          <div className="p-5 space-y-5">
            <p className="text-sm text-muted-foreground">{t("griev.subtitle")}</p>

            {/* Category Selection */}
            <div>
              <Label className="mb-2 block">{t("griev.category")} *</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button key={c.id} onClick={() => { setCategory(c.id); setQuestionAnswers({}); }}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition hover:shadow-md ${category === c.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}><Icon className="h-5 w-5" /></div>
                      <span className="text-[11px] font-semibold">{c.label[lang] || c.label.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic follow-up questions */}
            {category && questions.length > 0 && (
              <div className="space-y-3 rounded-xl bg-secondary/50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Follow-up Questions</div>
                {questions.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <Label className="text-xs">{q.label[lang] || q.label.en}</Label>
                    <Input value={questionAnswers[q.id] ?? ""} onChange={(e) => setQuestionAnswers({ ...questionAnswers, [q.id]: e.target.value })} placeholder="..." />
                  </div>
                ))}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>{t("griev.subject")} *</Label>
              <Input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short title (e.g. PM-KISAN payment not received)" />
            </div>

            {/* Description with AI improve */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t("griev.description")} *</Label>
                <button onClick={improveText} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20">
                  <Wand2 className="h-3 w-3" /> {t("griev.ai_improve")}
                </button>
              </div>
              <Textarea required value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="Explain in detail — when, which scheme, reference numbers, actions taken..." />
            </div>

            <Button onClick={submit} disabled={busy || !category || !subject || !desc} className="w-full sm:w-auto">
              <MessageSquarePlus className="mr-1.5 h-4 w-4" /> {busy ? "Submitting…" : t("griev.submit")}
            </Button>
          </div>
        </div>

        {/* Past grievances */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">{t("griev.my_grievances")}</h2>
          </div>
          <div className="p-3">
            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">{t("griev.no_grievances")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div><div className="text-sm font-semibold">{r.subject}</div><div className="text-[11px] text-muted-foreground">{r.ai_category ?? "General"} · {new Date(r.created_at).toLocaleString()}</div></div>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={r.priority} />
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.status === "resolved" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}>{r.status.replace("_"," ")}</span>
                      </div>
                    </div>
                    {r.admin_response && (
                      <div className="mt-2 rounded-lg bg-primary/5 p-2.5 text-xs"><span className="font-semibold text-primary">{t("griev.officer_response")}:</span> {r.admin_response}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Classification sidebar */}
      <aside>
        <div className="sticky top-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> {t("griev.ai_class")}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Live preview as you type</p>
          <div className="mt-4 space-y-3 text-sm">
            <SideRow label="Category" value={ai.category} />
            <SideRow label="Priority" value={<PriorityBadge priority={ai.priority} />} />
            <SideRow label="Keywords" value={ai.keywords.length ? ai.keywords.join(", ") : "—"} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function SideRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
