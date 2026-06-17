import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapboxMap, MapDrawToolbar, type RoadFeatureInfo, type OverlayKind } from "@/components/mapbox-map";
import { PanelHeader } from "@/components/kpi-card";
import { TimelineSlider } from "@/components/timeline-slider";
import { DecisionReport } from "@/components/decision-report";
import { Button } from "@/components/ui/button";
import {
  Ban, MoveRight, Wrench, Plus, Play, RotateCcw,
  Activity, Flame, Droplets, EyeOff, MapPin, Siren, Columns2,
} from "lucide-react";
import { createSimulation } from "@/lib/api/crud";
import { toast } from "sonner";
import { type HorizonKey } from "@/lib/delhi-data";
import { computeImpact, buildPropagationFC, buildEmergencyCorridorFC, type Action } from "@/lib/sim-engine";

export const Route = createFileRoute("/_authenticated/simulator")({
  head: () => ({
    meta: [
      { title: "Simulator — UrbanVerse Delhi" },
      { name: "description", content: "Run what-if scenarios on the real Delhi NCR road network." },
    ],
  }),
  component: Simulator,
});

function Simulator() {
  const [action, setAction] = useState<Action>("block");
  const [overlay, setOverlay] = useState<OverlayKind>("traffic");
  const [drawMode, setDrawMode] = useState<"none" | "road" | "route">("none");
  const [emergencyLayer, setEmergencyLayer] = useState(true);
  const [horizon, setHorizon] = useState<HorizonKey>("now");
  const [compare, setCompare] = useState(false);
  const [selection, setSelection] = useState<{ count: number; lastClicked: RoadFeatureInfo | null }>({
    count: 0,
    lastClicked: null,
  });
  const [drawnFeatures, setDrawnFeatures] = useState<import("geojson").Feature[]>([]);
  const [ran, setRan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const queryClient = useQueryClient();

  const lc = selection.lastClicked;
  const focal = lc && lc.lng != null && lc.lat != null ? { lng: lc.lng, lat: lc.lat } : null;

  const report = useMemo(
    () => computeImpact(focal, action, horizon, lc?.class ?? null),
    [focal?.lng, focal?.lat, action, horizon, lc?.class],
  );
  const propagationFC = useMemo(
    () => buildPropagationFC(focal, action, horizon, lc?.class ?? null),
    [focal?.lng, focal?.lat, action, horizon, lc?.class],
  );
  const corridorsFC = useMemo(() => buildEmergencyCorridorFC(focal), [focal?.lng, focal?.lat]);

  const runAndSave = async () => {
    setRan(true);
    setSaving(true);
    try {
      await createSimulation({
        action,
        result_json: {
          selectedCount: selection.count,
          lastClicked: selection.lastClicked,
          drawn: drawnFeatures,
          horizon,
          ...report,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      toast.success("Scenario saved to archive");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSelection({ count: 0, lastClicked: null });
    setDrawnFeatures([]);
    setRan(false);
    setMapKey((k) => k + 1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-panel px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Action</div>
        <div className="flex gap-1">
          <ActionBtn icon={Ban} label="Block Road" active={action === "block"} onClick={() => setAction("block")} />
          <ActionBtn icon={MoveRight} label="Extend Road" active={action === "extend"} onClick={() => setAction("extend")} />
          <ActionBtn icon={Wrench} label="Repair Road" active={action === "repair"} onClick={() => setAction("repair")} />
          <ActionBtn icon={Plus} label="Build New Road" active={action === "build"} onClick={() => setAction("build")} />
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <MapDrawToolbar
          mode={drawMode}
          setMode={setDrawMode}
          onClear={() => { setDrawnFeatures([]); setMapKey((k) => k + 1); }}
        />

        <div className="flex-1" />

        <div className="text-mono text-xs text-muted-foreground">
          <span className="text-foreground">{selection.count}</span> selected
          {drawnFeatures.length > 0 && (
            <> · <span className="text-foreground">{drawnFeatures.length}</span> drawn</>
          )}
        </div>
        <Button
          variant={compare ? "default" : "ghost"}
          size="sm"
          onClick={() => setCompare((v) => !v)}
          className={compare ? "bg-primary/15 border border-primary/50 text-foreground hover:bg-primary/20" : ""}
        >
          <Columns2 className="size-3.5 mr-1.5" /> {compare ? "Single View" : "Compare"}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-3.5 mr-1.5" /> Reset
        </Button>
        <Button
          size="sm"
          disabled={(selection.count === 0 && drawnFeatures.length === 0) || saving}
          onClick={runAndSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Play className="size-3.5 mr-1.5" /> {saving ? "Saving…" : "Run Simulation"}
        </Button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="basis-3/4 grow-0 shrink-0 relative panel-surface m-3 mr-1.5 rounded-md overflow-hidden">
          <div className="absolute z-10 top-3 left-3 panel-surface rounded-md p-1 flex gap-1 shadow-lg">
            <OverlayBtn icon={EyeOff} label="None" active={overlay === "none"} onClick={() => setOverlay("none")} />
            <OverlayBtn icon={Activity} label="Traffic" active={overlay === "traffic"} onClick={() => setOverlay("traffic")} />
            <OverlayBtn icon={Flame} label="Heatmap" active={overlay === "heatmap"} onClick={() => setOverlay("heatmap")} />
            <OverlayBtn icon={Droplets} label="Flood" active={overlay === "flood"} onClick={() => setOverlay("flood")} />
            <OverlayBtn icon={Siren} label="Emergency" active={emergencyLayer} onClick={() => setEmergencyLayer((v) => !v)} />
          </div>

          <div className="absolute z-10 top-3 right-12">
            <TimelineSlider value={horizon} onChange={setHorizon} />
          </div>

          {compare ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 bg-border">
              <div className="relative bg-panel">
                <div className="absolute z-10 top-3 left-3 panel-surface rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Before · Present day
                </div>
                <MapboxMap
                  key={`L-${mapKey}`}
                  overlay={overlay}
                  horizon="now"
                  emergencyLayer={false}
                  syncGroup={`sim-${mapKey}`}
                  syncId="left"
                  interactive={false}
                />
              </div>
              <div className="relative bg-panel">
                <div className="absolute z-10 top-3 left-3 panel-surface rounded px-2 py-1 text-[10px] uppercase tracking-wider text-primary">
                  After · {horizon === "now" ? "Scenario" : horizon}
                </div>
                <MapboxMap
                  key={`R-${mapKey}`}
                  overlay={overlay}
                  drawMode={drawMode}
                  onSelectionChange={setSelection}
                  onDrawCreate={(f) => setDrawnFeatures((prev) => [...prev, f])}
                  horizon={horizon}
                  emergencyLayer={emergencyLayer}
                  propagationFC={propagationFC}
                  emergencyCorridorsFC={corridorsFC}
                  syncGroup={`sim-${mapKey}`}
                  syncId="right"
                />
              </div>
            </div>
          ) : (
            <MapboxMap
              key={mapKey}
              overlay={overlay}
              drawMode={drawMode}
              onSelectionChange={setSelection}
              onDrawCreate={(f) => setDrawnFeatures((prev) => [...prev, f])}
              horizon={horizon}
              emergencyLayer={emergencyLayer}
              propagationFC={propagationFC}
              emergencyCorridorsFC={corridorsFC}
            />
          )}
        </div>

        <div className="basis-1/4 grow-0 shrink-0 flex flex-col gap-2 m-3 ml-1.5 min-h-0">
          <div className="panel-surface rounded-md flex flex-col overflow-hidden">
            <PanelHeader subtitle="Inspector" title="Road Details" />
            {selection.lastClicked ? (
              <div className="p-3 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{selection.lastClicked.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {selection.lastClicked.class}
                      {selection.lastClicked.type ? ` · ${selection.lastClicked.type}` : ""}
                    </div>
                  </div>
                </div>
                <DetailRow k="Lanes" v={selection.lastClicked.lanes ?? "—"} />
                <DetailRow k="Max speed" v={selection.lastClicked.maxspeed ?? "—"} />
                <DetailRow k="Surface" v={selection.lastClicked.surface ?? "—"} />
              </div>
            ) : (
              <div className="p-4 text-xs text-muted-foreground">
                Click any road on the map to inspect. Adjust the timeline to project impacts.
              </div>
            )}
          </div>

          <div className="panel-surface rounded-md flex flex-col overflow-hidden flex-1 min-h-0">
            <PanelHeader subtitle={`Decision Report · ${horizon}`} title="AI Impact Assessment" />
            {!focal ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="size-10 rounded-full bg-accent/40 grid place-items-center mb-2">
                  <Play className="size-4 text-muted-foreground" />
                </div>
                <div className="text-xs font-medium">No active scenario</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Click a road to generate a full decision report.
                </div>
              </div>
            ) : (
              <DecisionReport r={report} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
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

function OverlayBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={
        "flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded transition-colors " +
        (active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground")
      }
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-[11px] border-t border-border/60 pt-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-mono text-foreground">{v}</span>
    </div>
  );
}
