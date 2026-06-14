import { createFileRoute } from "@tanstack/react-router";
import { PanelHeader } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — UrbanVerse" },
      { name: "description", content: "Previous simulations, AI recommendations, and exportable PDF reports." },
    ],
  }),
  component: Reports,
});

const reports = [
  { id: "S-2026-0418", title: "I-95 corridor closure · phased rollout", date: "2026-06-12", author: "E. Vasquez", impact: "−14% peak congestion", status: "Approved" },
  { id: "S-2026-0411", title: "Riverside flood mitigation · seawall + pumps", date: "2026-06-08", author: "M. Okafor", impact: "−62% 100-yr exposure", status: "Under review" },
  { id: "S-2026-0402", title: "Madison Ave overpass repair window", date: "2026-06-01", author: "K. Tanaka", impact: "+96% load capacity", status: "Approved" },
  { id: "S-2026-0388", title: "EV charging corridor expansion · Phase 2", date: "2026-05-24", author: "E. Vasquez", impact: "+18% adoption forecast", status: "Draft" },
  { id: "S-2026-0376", title: "Transit signal priority · Route 1A", date: "2026-05-19", author: "J. Lindqvist", impact: "−2.4 min avg travel", status: "Approved" },
];

const recs = [
  { tag: "HIGH PRIORITY", title: "Reinforce Madison Ave overpass before Q4", body: "Stress sensors show 14% load increase YoY. Reinforcement during low-traffic windows minimizes disruption while extending asset life by an estimated 18 years." },
  { tag: "STRATEGIC", title: "Stage Riverside seawall expansion", body: "Climate models project +0.8m sea level by 2055. Phased seawall construction across 3 fiscal years aligns with bond capacity and reduces 100-year flood exposure by 62%." },
  { tag: "OPTIMIZATION", title: "Re-time signals on Route 1A corridor", body: "ML analysis of 90-day traffic flow suggests adaptive signal timing could reduce peak travel by 2.4 minutes per trip — affecting 184K daily commuters." },
];

function Reports() {
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
                {reports.map((r) => (
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
