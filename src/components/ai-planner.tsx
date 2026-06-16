import { useState } from "react";
import { Send, Sparkles, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/kpi-card";
import { emitFlyTo, resolveDelhiLocation } from "@/lib/delhi-data";

type Msg = { from: "ai" | "user"; text: string };

const seedMessages: Msg[] = [
  {
    from: "ai",
    text:
      "Namaste. Overnight telemetry from Delhi corridors is in — congestion on NH-48 (Delhi–Gurugram) is up 9% vs the 7-day baseline. Should I model a diversion via the Outer Ring Road?",
  },
];

const suggestions = [
  "Simulate road closure near Rajiv Chowk Metro Station",
  "Analyze traffic impact around Laxmi Nagar",
  "Build a road near Connaught Place",
  "Forecast flood impact along the Yamuna at ITO",
  "Assess infrastructure stress at Ghazipur",
];

export function AIPlanner() {
  const [messages, setMessages] = useState<Msg[]>(seedMessages);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");

    const loc = resolveDelhiLocation(text);
    if (loc) emitFlyTo({ lng: loc.lng, lat: loc.lat, zoom: 14.8, label: loc.name });

    setTimeout(() => {
      const where = loc ? loc.name : "the selected corridor";
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: loc
            ? `Centred the atlas on ${where}. Running the scenario across nearby road class, intersection density, metro proximity, and hospital access. Projected outcome: −7.4% peak congestion, +1.8 min avg emergency response, ~38k residents impacted within a 1.5 km radius. Generate full assessment?`
            : `Could not match a Delhi location in that prompt — try a landmark like "AIIMS", "Saket", or "Anand Vihar". I'll still model the generic scenario: −6% peak congestion, ~42k residents impacted.`,
        },
      ]);
    }, 650);
  };

  return (
    <div className="w-80 shrink-0 border-l border-border bg-panel flex flex-col">
      <PanelHeader
        subtitle="Co-pilot · Delhi NCR"
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
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="size-2.5" /> UrbanVerse · Delhi · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            {m.text}
          </div>
        ))}
      </div>

      <div className="px-3 pb-2 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Suggested Delhi scenarios
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
            placeholder="Ask about any Delhi area…"
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
