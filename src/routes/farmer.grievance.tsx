import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { classifyGrievance } from "@/lib/ai-rules";

export const Route = createFileRoute("/farmer/grievance")({
  component: GrievancePage,
});

const schema = z.object({
  subject: z.string().trim().min(5, "Subject too short").max(120),
  description: z.string().trim().min(20, "Please describe at least 20 characters").max(2000),
});

function GrievancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const preview = text.length >= 10 ? classifyGrievance(text) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      subject: fd.get("subject"),
      description: fd.get("description"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const cls = classifyGrievance(`${parsed.data.subject} ${parsed.data.description}`);
    const { error } = await supabase.from("grievances").insert([{
      farmer_id: user.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      ai_category: cls.category,
      priority: cls.priority,
    }]);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Grievance filed under "${cls.category}" (${cls.priority} priority).`);
    navigate({ to: "/farmer" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">File a grievance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your issue clearly. Our system will categorise and route it to the right officer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" placeholder="e.g. PM-KISAN payment not received" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Describe what happened</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="When did the issue start? What scheme is affected? Have you contacted anyone?"
            required
          />
        </div>

        {preview && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-soft/50 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-primary" />
            <div className="text-xs">
              <div className="font-semibold text-foreground">AI suggestion</div>
              <div className="text-muted-foreground">
                Likely category: <span className="font-medium text-foreground">{preview.category}</span> ·
                Priority: <span className="font-medium uppercase text-foreground">{preview.priority}</span>
                {preview.keywords.length > 0 && <> · Matched: {preview.keywords.join(", ")}</>}
              </div>
            </div>
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy ? "Filing…" : "Submit grievance"}
        </Button>
      </form>
    </div>
  );
}
