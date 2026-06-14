import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CityMap } from "@/components/city-map";
import { AIPlanner } from "@/components/ai-planner";
import { PanelHeader } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Ban, MoveRight, Wrench, Plus, Play, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Simulator — UrbanVerse" },
      { name: "description", content: "Run what-if scenarios on the city road network." },
    ],
  }),
  component: Simulator,
});

type Action = "block" | "extend" | "repair" | "build";

function Simulator() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action>("block");
  const [ran, setRan] = useState(false);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    setRan(false);
  };

  const reset = () => { setSelected(new Set()); setRan(false); };

  // Deterministic mock results based on selection count + action
  const n = selected.size;
  const mult = { block: 1, extend: -0.6, repair: -0.3, build: -0.8 }[action];
  const results = {
    trafficDelta: n === 0 ? 0 : +(n * 4.2 * mult).toFixed(1),
    congestionDelta: n === 0 ? 0 : +(n * 6.1 * mult).toFixed(1),
    emergencyDelay: n === 0 ? 0 : +(n * 0.7 * Math.max(mult, 0.2)).toFixed(2),
    population: n * 4180 + (action === "block" ? 2400 : 0),
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Action bar */}
        <div className="border-b border-border bg-panel px-4 py-2.5 flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Action
          </div>
          <div className="flex gap-1">
            <ActionBtn icon={Ban} label="Block Road" active={action === "block"} onClick={() => setAction("block")} />
            <ActionBtn icon={MoveRight} label="Extend Road" active={action === "extend"} onClick={() => setAction("extend")} />
            <ActionBtn icon={Wrench} label="Repair Road" active={action === "repair"} onClick={() => setAction("repair")} />
            <ActionBtn icon={Plus} label="Build New Road" active={action === "build"} onClick={() => setAction("build")} />
          </div>
          <div className="flex-1" />
          <div className="text-mono text-xs text-muted-foreground">
            <span className="text-foreground">{selected.size}</span> segments selected
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5 mr-1.5" /> Reset
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0}
            onClick={() => setRan(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play className="size-3.5 mr-1.5" /> Run Simulation
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-2 p-3 min-h-0">
          <div className="col-span-2 panel-surface rounded-md overflow-hidden flex flex-col min-h-0">
            <PanelHeader
              subtitle="Scenario · S-2026-0418"
              title="Network Editor"
              right={
                <span className="text-[10px] text-mono text-muted-foreground">
                  Click highways & arterials to select
                </span>
              }
            />
            <div className="flex-1 min-h-0 relative">
              <CityMap selectable selected={selected} onToggle={toggle} overlay="traffic" />
            </div>
          </div>

          {/* Results */}
          <div className="panel-surface rounded-md flex flex-col overflow-hidden min-h-0">
            <PanelHeader subtitle="Output" title="Simulation Results" />
            {!ran ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="size-12 rounded-full bg-accent/40 grid place-items-center mb-3">
                  <Play className="size-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">No active scenario</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Select road segments and run simulation to forecast network response.
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3 overflow-y-auto">
                <ResultRow
                  label="Traffic flow"
                  value={`${results.trafficDelta > 0 ? "+" : ""}${results.trafficDelta}%`}
                  hint="Network-wide volume change"
                  status={results.trafficDelta > 0 ? "danger" : "safe"}
                />
                <ResultRow
                  label="Congestion"
                  value={`${results.congestionDelta > 0 ? "+" : ""}${results.congestionDelta}%`}
                  hint="Peak-hour bottleneck index"
                  status={results.congestionDelta > 0 ? "warn" : "safe"}
                />
                <ResultRow
                  label="Emergency response delay"
                  value={`${results.emergencyDelay > 0 ? "+" : ""}${results.emergencyDelay} min`}
                  hint="Avg time-to-scene · EMS/Fire"
                  status={results.emergencyDelay > 0.5 ? "danger" : results.emergencyDelay > 0 ? "warn" : "safe"}
                />
                <ResultRow
                  label="Population affected"
                  value={results.population.toLocaleString()}
                  hint="Residents in disruption radius"
                  status="info"
                />

                <div className="border-t border-border pt-3 mt-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Planner recommendation
                  </div>
                  <div className="text-xs leading-relaxed text-foreground/90">
                    {action === "block"
                      ? "Blocking these segments will reroute ~36% of traffic to parallel arterials. Consider staged closures during off-peak windows."
                      : action === "extend"
                        ? "Extension projected to absorb 12-18% overflow from adjacent corridors. ROI break-even in ~14 months."
                        : action === "repair"
                          ? "Repair pass restores 96% structural capacity. Schedule overnight to minimize disruption."
                          : "New road segment improves connectivity for 4 sub-districts. Environmental review required."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIPlanner />
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, active, onClick,
}: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors " +
        (active
          ? "bg-primary/15 border-primary/50 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/40")
      }
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function ResultRow({
  label, value, hint, status,
}: { label: string; value: string; hint: string; status: "safe" | "warn" | "danger" | "info" }) {
  const color = { safe: "text-safe", warn: "text-warn", danger: "text-danger", info: "text-info" }[status];
  return (
    <div className="border border-border rounded-md p-2.5 bg-background/40">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <span className={`size-1.5 rounded-full bg-${status}`} />
      </div>
      <div className={`text-mono text-xl mt-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}
