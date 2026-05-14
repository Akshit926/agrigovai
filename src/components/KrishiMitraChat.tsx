import { useState, useRef, useEffect } from "react";
import { X, Send, Sprout, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getChatResponse } from "@/lib/chatbot";

interface Msg { role: "user" | "assistant"; content: string }

export function KrishiMitraChat() {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("chat.welcome") }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getChatResponse(text, lang);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: "var(--gradient-hero)" }}
        aria-label="Open KrishiMitra AI"
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
            </span>
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" style={{ height: "min(520px, calc(100vh - 8rem))" }}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border p-4 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{t("chat.title")}</div>
              <div className="text-[10px] text-white/80">{t("chat.subtitle")}</div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                    <Sprout className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-foreground"
                }`}>
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line.replace(/\*\*(.*?)\*\*/g, "").replace(/\•/g, "•")}
                      {j < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                  <Sprout className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground transition disabled:opacity-40"
                style={{ background: "var(--gradient-hero)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
