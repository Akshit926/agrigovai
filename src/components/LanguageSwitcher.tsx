import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n, LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 transition hover:bg-secondary"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{current.flag} {current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-secondary ${l.code === lang ? "bg-primary/5 font-semibold text-primary" : "text-foreground"}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span className="ml-auto text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
