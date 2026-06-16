import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapboxMap, MapDrawToolbar, type RoadFeatureInfo, type OverlayKind } from "@/components/mapbox-map";
import { PanelHeader } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Ban, MoveRight, Wrench, Plus, Play, RotateCcw,
  Activity, Flame, Droplets, EyeOff, MapPin,
} from "lucide-react";
import { createSimulation } from "@/lib/api/crud";
import { toast } from "sonner";

import { ALL_POIS, HOSPITALS, METRO_STATIONS, SCHOOLS } from "@/lib/delhi-data";

export const Route = createFileRoute("/_authenticated/simulator")({
  head: () => ({
    meta: [
      { title: "Simulator — UrbanVerse Delhi" },
      { name: "description", content: "Run what-if scenarios on the real Delhi NCR road network." },
    ],
  }),
  component: Simulator,
});

type Action = "block" | "extend" | "repair" | "build";

// Approx distance in metres between two lng/lat points (equirectangular).
function distM(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = dLng * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.sqrt(x * x + dLat * dLat) * R;
}

// Returns counts of POIs within radius
function nearbyContext(point: { lng: number; lat: number } | null, radiusM = 1500) {
  if (!point) return { hospitals: 0, metros: 0, schools: 0, pois: 0 };
  const within = (list: typeof ALL_POIS) => list.filter((p) => distM(point, p) <= radiusM).length;
  return {
    hospitals: within(HOSPITALS),
    metros: within(METRO_STATIONS),
    schools: within(SCHOOLS),
    pois: within(ALL_POIS),
  };
}

function Simulator() {
  const [action, setAction] = useState<Action>("block");
  const [overlay, setOverlay] = useState<OverlayKind>("traffic");
  const [drawMode, setDrawMode] = useState<"none" | "road" | "route">("none");
  const [selection, setSelection] = useState<{ count: number; lastClicked: RoadFeatureInfo | null }>({
    count: 0,
    lastClicked: null,
  });
  const [drawnFeatures, setDrawnFeatures] = useState<import("geojson").Feature[]>([]);
  const [ran, setRan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const queryClient = useQueryClient();

  const n = selection.count;
  const lc = selection.lastClicked;
  const ctx = nearbyContext(lc && lc.lng != null && lc.lat != null ? { lng: lc.lng, lat: lc.lat } : null);
  // Road class weight (motorways/highways move more people)
  const classW = lc?.class
    ? ({ motorway: 1.6, trunk: 1.4, primary: 1.2, secondary: 1.0, tertiary: 0.8 } as Record<string, number>)[lc.class] ?? 0.6
    : 1.0;
  // Negative = improvement (good), Positive = worsening
  const dir = { block: 1, extend: -0.6, repair: -0.3, build: -0.8 }[action];
  const base = Math.max(n, lc ? 1 : 0);
  const connectivityPenalty = 1 + ctx.metros * 0.15 + ctx.pois * 0.02;
  const results = {
    trafficDelta: +(base * 5.2 * dir * classW * connectivityPenalty).toFixed(1),
    congestionDelta: +(base * 7.4 * dir * classW * connectivityPenalty).toFixed(1),
    emergencyDelay: +(base * 0.9 * Math.max(dir, 0.2) * (1 + ctx.hospitals * 0.25)).toFixed(2),
    nearbyCongestion: +(base * 4.1 * dir * classW).toFixed(1),
    travelTimeDelta: +(base * 1.4 * dir * classW).toFixed(1),
    population: Math.round(base * (5200 + ctx.schools * 1800 + ctx.metros * 4600) + (action === "block" ? 6200 : 0)),
    context: ctx,
    roadClass: lc?.class ?? null,
  };

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
          ...results,
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
    setMapKey((k) => k + 1); // remount map to clear feature-state + drawings
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action bar */}
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

      {/* Map (75%) + side panel (25%) */}
      <div className="flex-1 flex min-h-0">
        <div className="basis-3/4 grow-0 shrink-0 relative panel-surface m-3 mr-1.5 rounded-md overflow-hidden">
          {/* Overlay toggles floating top-left */}
          <div className="absolute z-10 top-3 left-3 panel-surface rounded-md p-1 flex gap-1 shadow-lg">
            <OverlayBtn icon={EyeOff} label="None" active={overlay === "none"} onClick={() => setOverlay("none")} />
            <OverlayBtn icon={Activity} label="Traffic" active={overlay === "traffic"} onClick={() => setOverlay("traffic")} />
            <OverlayBtn icon={Flame} label="Heatmap" active={overlay === "heatmap"} onClick={() => setOverlay("heatmap")} />
            <OverlayBtn icon={Droplets} label="Flood" active={overlay === "flood"} onClick={() => setOverlay("flood")} />
          </div>

          <MapboxMap
            key={mapKey}
            overlay={overlay}
            drawMode={drawMode}
            onSelectionChange={setSelection}
            onDrawCreate={(f) => setDrawnFeatures((prev) => [...prev, f])}
          />
        </div>

        <div className="basis-1/4 grow-0 shrink-0 flex flex-col gap-2 m-3 ml-1.5 min-h-0">
          {/* Road details */}
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
                <DetailRow k="Segment ID" v={String(selection.lastClicked.id)} />
                <DetailRow k="Lanes" v={selection.lastClicked.lanes ?? "—"} />
                <DetailRow k="Max speed" v={selection.lastClicked.maxspeed ?? "—"} />
                <DetailRow k="Surface" v={selection.lastClicked.surface ?? "—"} />
              </div>
            ) : (
              <div className="p-4 text-xs text-muted-foreground">
                Click any road on the map to inspect it. Click again to deselect. Use draw tools to add custom roads or proposed routes.
              </div>
            )}
          </div>

          {/* Results */}
          <div className="panel-surface rounded-md flex flex-col overflow-hidden flex-1 min-h-0">
            <PanelHeader subtitle="Output" title="Simulation Results" />
            {!ran ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="size-10 rounded-full bg-accent/40 grid place-items-center mb-2">
                  <Play className="size-4 text-muted-foreground" />
                </div>
                <div className="text-xs font-medium">No active scenario</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Select roads and run the simulation to forecast network response.
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2 overflow-y-auto">
                <ResultRow label="Traffic" value={`${results.trafficDelta > 0 ? "+" : ""}${results.trafficDelta}%`} status={results.trafficDelta > 0 ? "danger" : "safe"} />
                <ResultRow label="Congestion" value={`${results.congestionDelta > 0 ? "+" : ""}${results.congestionDelta}%`} status={results.congestionDelta > 0 ? "warn" : "safe"} />
                <ResultRow label="Emergency delay" value={`${results.emergencyDelay > 0 ? "+" : ""}${results.emergencyDelay} min`} status={results.emergencyDelay > 0.5 ? "danger" : results.emergencyDelay > 0 ? "warn" : "safe"} />
                <ResultRow label="Population affected" value={results.population.toLocaleString()} status="info" />
              </div>
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

function ResultRow({ label, value, status }: { label: string; value: string; status: "safe" | "warn" | "danger" | "info" }) {
  const color = { safe: "text-safe", warn: "text-warn", danger: "text-danger", info: "text-info" }[status];
  return (
    <div className="border border-border rounded-md p-2.5 bg-background/40">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <span className={`size-1.5 rounded-full bg-${status}`} />
      </div>
      <div className={`text-mono text-lg mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
