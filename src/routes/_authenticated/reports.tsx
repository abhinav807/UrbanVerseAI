import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PanelHeader } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Sparkles, Loader2 } from "lucide-react";
import { simulationsApi, type Simulation } from "@/lib/api/crud";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — UrbanVerse Delhi" },
      { name: "description", content: "Delhi NCR urban impact assessments, AI recommendations, and exportable PDF reports." },
    ],
  }),
  component: Reports,
});

const reports = [
  { id: "S-2026-0418", title: "NH-48 Delhi–Gurugram peak diversion · phased rollout", date: "2026-06-12", author: "E. Vasquez", impact: "−14% peak congestion", status: "Approved" },
  { id: "S-2026-0411", title: "Yamuna floodplain mitigation · ITO embankment + Okhla pumps", date: "2026-06-08", author: "M. Okafor", impact: "−58% 100-yr exposure", status: "Under review" },
  { id: "S-2026-0402", title: "Minto Bridge underpass pumping upgrade", date: "2026-06-01", author: "K. Tanaka", impact: "+96% drainage capacity", status: "Approved" },
  { id: "S-2026-0388", title: "DMRC Phase IV last-mile EV feeder corridors", date: "2026-05-24", author: "E. Vasquez", impact: "+18% ridership forecast", status: "Draft" },
  { id: "S-2026-0376", title: "Adaptive signal priority · Ring Road (AIIMS–Bhairon Marg)", date: "2026-05-19", author: "J. Lindqvist", impact: "−2.6 min avg travel", status: "Approved" },
];

const recs = [
  { tag: "HIGH PRIORITY", title: "Reinforce Minto Bridge & ITO drainage before monsoon", body: "Pump-station telemetry shows recurring overflow during >40 mm/hr events. Upgrading capacity ahead of July monsoon reduces Connaught Place catchment flooding risk by an estimated 71%." },
  { tag: "STRATEGIC", title: "Phase Yamuna floodplain embankment · Wazirabad → Okhla", body: "CWC hydrology projects 204.8 m peak at Old Railway Bridge by 2030. Phased embankment + retention ponds across 3 fiscal years lower 100-year flood exposure for ~1.2M residents." },
  { tag: "OPTIMIZATION", title: "Re-time NH-48 ramps · Dhaula Kuan to Sirhaul", body: "ML analysis of 90-day flow data suggests adaptive ramp metering could shave 2.6 min/trip on the Delhi–Gurugram corridor — affecting ~340K daily commuters and EMS routes to AIIMS / Medanta." },
];

function Reports() {
  const { data: live = [], isLoading } = useQuery({
    queryKey: ["simulations"],
    queryFn: () => simulationsApi.list(),
  });

  const liveRows = live.map((s: Simulation) => {
    const r = (s.result_json ?? {}) as Record<string, any>;
    const impact = typeof r.trafficDelta === "number"
      ? `${r.trafficDelta > 0 ? "+" : ""}${r.trafficDelta}% traffic`
      : "—";
    return {
      id: `S-${s.id.slice(0, 8).toUpperCase()}`,
      title: `${s.action.charAt(0).toUpperCase() + s.action.slice(1)} scenario`,
      date: new Date(s.created_at).toISOString().slice(0, 10),
      author: "You",
      impact,
      status: "Draft" as const,
      _live: true as const,
    };
  });

  const allRows = [...liveRows, ...reports];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Archive
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Reports & Recommendations</h1>
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="size-3.5 mr-1.5" /> Export all (PDF)
          </Button>
        </div>

        {/* AI recs */}
        <div className="panel-surface rounded-md">
          <PanelHeader
            subtitle="Generated 08:41 EDT"
            title="AI Recommendations"
            right={
              <span className="flex items-center gap-1.5 text-[10px] text-mono text-safe uppercase">
                <Sparkles className="size-3" /> 3 new
              </span>
            }
          />
          <div className="grid md:grid-cols-3 gap-2 p-3">
            {recs.map((r) => (
              <div key={r.title} className="border border-border rounded-md p-3 bg-background/40">
                <div className="text-[10px] uppercase tracking-wider text-warn text-mono">{r.tag}</div>
                <div className="text-sm font-medium mt-1.5">{r.title}</div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{r.body}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">View scenario</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground">Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports table */}
        <div className="panel-surface rounded-md">
          <PanelHeader subtitle="Previous simulations" title="Scenario Archive" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background/40">
                  <th className="text-left font-normal py-2 px-3">ID</th>
                  <th className="text-left font-normal py-2 px-3">Scenario</th>
                  <th className="text-left font-normal py-2 px-3">Date</th>
                  <th className="text-left font-normal py-2 px-3">Author</th>
                  <th className="text-left font-normal py-2 px-3">Projected impact</th>
                  <th className="text-left font-normal py-2 px-3">Status</th>
                  <th className="text-right font-normal py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRows.map((r) => (
                  <tr key={r.id} className="hover:bg-accent/30">
                    <td className="py-2.5 px-3 text-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        {r.title}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-mono text-xs text-muted-foreground">{r.date}</td>
                    <td className="py-2.5 px-3 text-xs">{r.author}</td>
                    <td className="py-2.5 px-3 text-mono text-xs text-safe">{r.impact}</td>
                    <td className="py-2.5 px-3">
                      <span className={
                        "text-[10px] px-2 py-0.5 rounded text-mono uppercase " +
                        (r.status === "Approved"
                          ? "bg-safe/15 text-safe border border-safe/30"
                          : r.status === "Under review"
                            ? "bg-warn/15 text-warn border border-warn/30"
                            : "bg-muted text-muted-foreground border border-border")
                      }>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Download className="size-3 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
