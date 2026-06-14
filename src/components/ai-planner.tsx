import { useState } from "react";
import { Send, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/kpi-card";

type Msg = { from: "ai" | "user"; text: string };

const seedMessages: Msg[] = [
  {
    from: "ai",
    text: "Morning. I've reviewed overnight sensor data — congestion on the I-95 corridor is up 12% vs 7-day baseline. Want me to model a re-route via Route 1A?",
  },
];

const suggestions = [
  "Model rush-hour rerouting on I-95",
  "Forecast flood impact for 100-year storm",
  "Identify top 5 vulnerable intersections",
  "Estimate ROI of repaving Sector 4-B",
];

export function AIPlanner() {
  const [messages, setMessages] = useState<Msg[]>(seedMessages);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text:
            "Running scenario · 3 simulations queued. Projected outcome: -8% peak congestion, +2.1min avg emergency response, ~46k residents affected. Want a full report?",
        },
      ]);
    }, 700);
  };

  return (
    <div className="w-80 shrink-0 border-l border-border bg-panel flex flex-col">
      <PanelHeader
        subtitle="Co-pilot"
        title="AI Urban Planner"
        right={
          <span className="flex items-center gap-1.5 text-[10px] text-safe text-mono uppercase">
            <Sparkles className="size-3" /> Active
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.from === "ai"
                ? "text-sm bg-accent/40 border border-border rounded-md p-2.5 leading-relaxed"
                : "text-sm bg-primary/10 border border-primary/30 rounded-md p-2.5 leading-relaxed ml-6"
            }
          >
            {m.from === "ai" && (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                UrbanVerse · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            {m.text}
          </div>
        ))}
      </div>

      <div className="px-3 pb-2 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Suggested actions
        </div>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground flex items-center justify-between group"
          >
            <span>{s}</span>
            <ChevronRight className="size-3 opacity-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-background border border-border rounded-md px-2.5 py-1.5 focus-within:border-primary/60">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask the planner…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => send(input)}
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
