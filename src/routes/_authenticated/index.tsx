import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapboxMap } from "@/components/mapbox-map";
import { AIPlanner } from "@/components/ai-planner";
import { KpiCard, PanelHeader } from "@/components/kpi-card";
import { TimelineSlider } from "@/components/timeline-slider";
import { horizonFactors, type HorizonKey } from "@/lib/delhi-data";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UrbanVerse Delhi" },
      { name: "description", content: "Live Delhi NCR operations dashboard — traffic, Yamuna flood risk, infrastructure stress and population telemetry." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [horizon, setHorizon] = useState<HorizonKey>("now");
  const hf = horizonFactors(horizon);

  const kpis = useMemo(() => {
    const trafficIdx = +(72 * hf.trafficMul).toFixed(1);
    const floodIdx = +(31 * hf.floodMul).toFixed(0);
    const emergencyMin = +(7.4 * hf.emergencyMul).toFixed(1);
    const stressPct = +(86 - (hf.stressMul - 1) * 18).toFixed(1);
    const popMillions = +(2.1 * hf.popMul).toFixed(2);
    const urbanHealth = Math.round(
      100 - (trafficIdx - 60) * 0.3 - (floodIdx - 30) * 0.4 - (emergencyMin - 7) * 1.8 - (100 - stressPct) * 0.4,
    );
    return [
      {
        label: "Urban Health Score",
        value: String(Math.max(0, Math.min(100, urbanHealth))),
        unit: "/ 100",
        delta: `${horizon === "now" ? "baseline" : `projected ${horizon}`}`,
        trend: urbanHealth >= 70 ? "up" : "down",
        status: urbanHealth >= 75 ? "safe" : urbanHealth >= 55 ? "warn" : "danger",
        spark: [82, 80, 79, 78, 76, 75, 74, 72, 71, urbanHealth].map((v) => Math.max(0, v)),
      },
      {
        label: "Mobility Index · NCR",
        value: String(trafficIdx),
        unit: "/ 100",
        delta: `${horizon === "now" ? "+3.6% vs 24h" : `${((hf.trafficMul - 1) * 100).toFixed(1)}% horizon load`}`,
        trend: trafficIdx > 72 ? "up" : "flat",
        status: trafficIdx > 85 ? "danger" : trafficIdx > 70 ? "warn" : "safe",
        spark: [44, 50, 53, 51, 57, 62, 60, 67, 72, trafficIdx],
      },
      {
        label: "Emergency Readiness",
        value: String(emergencyMin),
        unit: "min avg",
        delta: `${emergencyMin <= 8 ? "Within SLA" : "+" + (emergencyMin - 7.4).toFixed(1) + " min vs base"}`,
        trend: emergencyMin > 7.4 ? "down" : "up",
        status: emergencyMin <= 8 ? "safe" : emergencyMin <= 10 ? "warn" : "danger",
        spark: [7.2, 7.3, 7.3, 7.4, 7.4, 7.5, 7.5, 7.6, 7.7, emergencyMin],
      },
      {
        label: "Yamuna Flood Risk",
        value: String(floodIdx),
        unit: "/ 100",
        delta: `204.1 m · Old Rly Bridge`,
        trend: floodIdx > 31 ? "up" : "flat",
        status: floodIdx > 55 ? "danger" : floodIdx > 35 ? "warn" : "info",
        spark: [18, 19, 21, 24, 26, 28, 27, 29, 30, floodIdx],
      },
      {
        label: "Infrastructure Health",
        value: String(stressPct),
        unit: "%",
        delta: "Ghazipur, Bhalswa pressure",
        trend: stressPct < 86 ? "down" : "flat",
        status: stressPct >= 80 ? "info" : stressPct >= 65 ? "warn" : "danger",
        spark: [92, 91, 91, 90, 89, 88, 88, 87, 87, stressPct],
      },
      {
        label: "Population Pressure",
        value: `${popMillions}M`,
        unit: "alert zones",
        delta: "Yamuna belt + East Delhi",
        trend: popMillions > 2.1 ? "up" : "flat",
        status: popMillions > 2.5 ? "danger" : "warn",
        spark: [1.7, 1.8, 1.85, 1.9, 1.95, 2.0, 2.02, 2.05, 2.08, popMillions].map((v) => v * 100),
      },
    ] as const;
  }, [horizon, hf]);

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Timeline + KPI strip */}
        <div className="border-b border-border bg-background">
          <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Operations dashboard · Delhi NCR
              </div>
              <div className="text-sm font-medium">Smart City Command — live telemetry</div>
            </div>
            <TimelineSlider value={horizon} onChange={setHorizon} />
          </div>
          <div className="grid grid-cols-6 gap-2 p-3 pt-1.5">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...(k as any)} />
            ))}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 grid grid-cols-3 gap-2 p-3 min-h-0">
          <div className="col-span-2 panel-surface rounded-md overflow-hidden flex flex-col min-h-0">
            <PanelHeader
              subtitle="Live tileset · OpenStreetMap · Delhi NCR"
              title="Delhi Metropolitan Network"
              right={
                <div className="flex gap-1.5 text-[10px] text-mono text-muted-foreground">
                  <span className="px-2 py-0.5 rounded border border-border bg-background">TRAFFIC</span>
                  <span className="px-2 py-0.5 rounded border border-border">METRO</span>
                  <span className="px-2 py-0.5 rounded border border-border">HOSPITALS</span>
                </div>
              }
            />
            <div className="flex-1 min-h-0 relative">
              <MapboxMap overlay="traffic" showPois horizon={horizon} emergencyLayer />
            </div>
          </div>

          <div className="panel-surface rounded-md flex flex-col overflow-hidden min-h-0">
            <PanelHeader subtitle="Incident feed · NCR" title="Active Events" />
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {events.map((e) => (
                <div key={e.id} className="p-3 hover:bg-accent/30">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider text-mono text-${e.level}`}>
                      ● {e.code}
                    </span>
                    <span className="text-[10px] text-mono text-muted-foreground">{e.time}</span>
                  </div>
                  <div className="text-sm mt-1">{e.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{e.loc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AIPlanner />
    </div>
  );
}

const events = [
  { id: 1, code: "T-2041", level: "danger", time: "08:42", title: "Severe congestion · NH-48 Delhi–Gurugram", loc: "Rajokri to Sirhaul · 4 km queue" },
  { id: 2, code: "F-0117", level: "warn", time: "08:31", title: "Yamuna water level rising at Old Railway Bridge", loc: "204.1 m · warning 204.5 m" },
  { id: 3, code: "I-0832", level: "warn", time: "08:18", title: "Pump house overload — Minto Bridge underpass", loc: "Connaught Place catchment" },
  { id: 4, code: "E-0044", level: "safe", time: "08:05", title: "EMS corridor cleared to AIIMS", loc: "Ring Road · green wave active" },
  { id: 5, code: "P-1290", level: "safe", time: "07:50", title: "DMRC services on schedule", loc: "All lines · 11 interchanges" },
  { id: 6, code: "T-2038", level: "warn", time: "07:42", title: "Signal drift — ITO crossing", loc: "Mathura Road / Bahadur Shah Zafar Marg" },
];
