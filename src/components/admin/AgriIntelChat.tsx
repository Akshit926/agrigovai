import { useState, useRef, useEffect } from "react";
import { Brain, Send, X, Sparkles, ChevronDown } from "lucide-react";
import { getAgriIntelResponse } from "@/lib/agri-intel";

interface Msg { role: "user" | "ai"; text: string; time: Date }

const QUICK_ACTIONS = [
  "Show summary", "Pending approvals", "Fraud alerts", "Unresolved grievances",
  "Duplicate land IDs", "District analytics", "Scheme demand", "Delayed applications", "Generate report",
];

export function AgriIntelChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hello, Officer! I'm **AgriIntel AI**, your smart agriculture administration assistant.\n\nI can analyze applications, detect fraud, summarize grievances, and generate reports using live data.\n\nTry asking me anything or use the quick actions below.", time: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", text: text.trim(), time: new Date() };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const response = await getAgriIntelResponse(text);
      setMsgs(prev => [...prev, { role: "ai", text: response, time: new Date() }]);
    } catch {
      setMsgs(prev => [...prev, { role: "ai", text: "Sorry, I couldn't process that request. Please try again.", time: new Date() }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg transition hover:scale-105 hover:shadow-xl">
          <Brain className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-bold text-black">AI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-700 to-green-600 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">AgriIntel AI</div>
              <div className="flex items-center gap-1 text-[10px] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                Smart Administration Assistant
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  {m.text.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1" : ""}>
                      {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={k}>{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  ))}
                  <div className="mt-1 text-[9px] opacity-50">{m.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-secondary px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs">Analyzing live data...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-t border-border">
            {QUICK_ACTIONS.map(action => (
              <button key={action} onClick={() => send(action)}
                className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition">
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              placeholder="Ask about applications, fraud, reports..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              disabled={loading}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
