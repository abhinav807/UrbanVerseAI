import { createFileRoute } from "@tanstack/react-router";
import { CityMap } from "@/components/city-map";
import { AIPlanner } from "@/components/ai-planner";
import { KpiCard, PanelHeader } from "@/components/kpi-card";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UrbanVerse" },
      { name: "description", content: "Live city operations dashboard with traffic, flood, infrastructure and population telemetry." },
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
            label="Traffic Index"
            value="74.2"
            unit="/ 100"
            delta="+3.1% vs 24h"
            trend="up"
            status="warn"
            spark={[42, 48, 51, 49, 55, 60, 58, 65, 70, 74]}
          />
          <KpiCard
            label="Flood Risk"
            value="LOW"
            delta="0.18 NDWI"
            status="safe"
            spark={[20, 22, 19, 24, 20, 18, 21, 19, 17, 18]}
          />
          <KpiCard
            label="Avg Travel Time"
            value="22.4"
            unit="min"
            delta="−1.2 min"
            trend="down"
            status="safe"
            spark={[28, 27, 26, 25, 24, 25, 24, 23, 22, 22]}
          />
          <KpiCard
            label="Population Impact"
            value="46.2K"
            unit="affected"
            delta="+2.4K active alerts"
            trend="up"
            status="warn"
            spark={[20, 24, 28, 32, 30, 36, 40, 42, 44, 46]}
          />
          <KpiCard
            label="Infrastructure Health"
            value="91.8"
            unit="%"
            delta="−0.4% degradation"
            trend="down"
            status="info"
            spark={[95, 94, 94, 93, 93, 92, 92, 92, 91, 91]}
          />
        </div>

        {/* Map area */}
        <div className="flex-1 grid grid-cols-3 gap-2 p-3 min-h-0">
          <div className="col-span-2 panel-surface rounded-md overflow-hidden flex flex-col min-h-0">
            <PanelHeader
              subtitle="Live tileset · UV-NYC-04"
              title="Metropolitan Network"
              right={
                <div className="flex gap-1.5 text-[10px] text-mono text-muted-foreground">
                  <span className="px-2 py-0.5 rounded border border-border bg-background">TRAFFIC</span>
                  <span className="px-2 py-0.5 rounded border border-border">FLOOD</span>
                  <span className="px-2 py-0.5 rounded border border-border">STRESS</span>
                </div>
              }
            />
            <div className="flex-1 min-h-0">
              <CityMap overlay="traffic" />
            </div>
          </div>

          <div className="panel-surface rounded-md flex flex-col overflow-hidden min-h-0">
            <PanelHeader subtitle="Incident feed" title="Active Events" />
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
  { id: 1, code: "T-2041", level: "danger", time: "08:42:11", title: "Severe congestion · I-95 NB MM 12", loc: "Sector 4-B · 3 lanes blocked" },
  { id: 2, code: "F-0117", level: "warn", time: "08:31:04", title: "Storm drain capacity at 78%", loc: "Riverside · Pump Station 14" },
  { id: 3, code: "I-0832", level: "warn", time: "08:18:47", title: "Bridge load anomaly detected", loc: "Madison Ave overpass" },
  { id: 4, code: "E-0044", level: "safe", time: "08:05:22", title: "EMS response time normalized", loc: "Downtown core" },
  { id: 5, code: "P-1290", level: "safe", time: "07:50:13", title: "Public transit on schedule", loc: "All MTA lines" },
  { id: 6, code: "T-2038", level: "warn", time: "07:42:08", title: "Signal timing drift — 14th & 7th", loc: "Sector 2-A" },
];
