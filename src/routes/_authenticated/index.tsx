import { createFileRoute } from "@tanstack/react-router";
import { MapboxMap } from "@/components/mapbox-map";
import { AIPlanner } from "@/components/ai-planner";
import { KpiCard, PanelHeader } from "@/components/kpi-card";

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
  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        {/* KPI strip */}
        <div className="grid grid-cols-5 gap-2 p-3 border-b border-border bg-background">
          <KpiCard
            label="Traffic Index · NCR"
            value="78.4"
            unit="/ 100"
            delta="+3.6% vs 24h"
            trend="up"
            status="warn"
            spark={[44, 50, 53, 51, 57, 62, 60, 67, 72, 78]}
          />
          <KpiCard
            label="Yamuna Flood Risk"
            value="MOD"
            delta="204.1 m at Old Rly Bridge"
            status="warn"
            spark={[18, 19, 21, 24, 26, 28, 27, 29, 30, 31]}
          />
          <KpiCard
            label="Avg Travel Time"
            value="34.8"
            unit="min"
            delta="+1.4 min"
            trend="up"
            status="warn"
            spark={[28, 29, 30, 31, 32, 32, 33, 33, 34, 34]}
          />
          <KpiCard
            label="Population Impact"
            value="2.1M"
            unit="in alert zones"
            delta="Yamuna belt + East Delhi"
            trend="up"
            status="warn"
            spark={[120, 140, 160, 180, 175, 190, 200, 205, 208, 210]}
          />
          <KpiCard
            label="Infrastructure Health"
            value="86.4"
            unit="%"
            delta="−0.6% (Ghazipur, Bhalswa)"
            trend="down"
            status="info"
            spark={[92, 91, 91, 90, 89, 88, 88, 87, 87, 86]}
          />
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
              <MapboxMap overlay="traffic" showPois />
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
