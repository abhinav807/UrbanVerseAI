import { cn } from "@/lib/utils";
import type { ImpactReport } from "@/lib/sim-engine";
import { Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, Lightbulb, Gauge } from "lucide-react";

const STATUS_COLOR: Record<ImpactReport["decisionStatus"], string> = {
  "Proceed": "text-safe border-safe/40 bg-safe/10",
  "Proceed with Conditions": "text-warn border-warn/40 bg-warn/10",
  "Reconsider": "text-warn border-warn/50 bg-warn/15",
  "Reject": "text-danger border-danger/50 bg-danger/15",
};

export function DecisionReport({ r }: { r: ImpactReport }) {
  return (
    <div className="space-y-2.5 p-3 overflow-y-auto">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-1.5">
        <Metric label="Traffic Impact" value={fmtPct(r.trafficDelta)} tone={r.trafficDelta > 0 ? "danger" : "safe"} />
        <Metric label="Travel Time" value={fmtPct(r.travelTimeDelta)} tone={r.travelTimeDelta > 0 ? "warn" : "safe"} />
        <Metric label="Flood Risk Δ" value={fmtPct(r.floodRiskDelta)} tone={r.floodRiskDelta > 1 ? "danger" : r.floodRiskDelta > 0 ? "warn" : "safe"} />
        <Metric label="Infra Stress Δ" value={fmtPct(r.infraStressDelta)} tone={r.infraStressDelta > 0 ? "warn" : "safe"} />
      </div>

      {/* Emergency response per service */}
      <div className="border border-border rounded-md p-2 bg-background/40">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Emergency response · projected
        </div>
        <div className="space-y-1">
          {r.emergency.map((e) => (
            <div key={e.service} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{e.service}</span>
              <div className="flex items-center gap-2">
                <span className="text-mono text-muted-foreground">{e.currentMin}m</span>
                <span className="text-muted-foreground">→</span>
                <span className={cn("text-mono", `text-${e.status}`)}>{e.projectedMin}m</span>
                <span className={cn("text-mono w-12 text-right", `text-${e.status}`)}>
                  {e.deltaMin >= 0 ? "+" : ""}{e.deltaMin}m
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Metric label="Population Impacted" value={r.population.toLocaleString()} tone="info" wide />

      {/* Pros / Cons */}
      <div className="grid grid-cols-2 gap-1.5">
        <BulletList icon={CheckCircle2} title="Pros" tone="safe" items={r.pros} />
        <BulletList icon={AlertTriangle} title="Cons" tone="warn" items={r.cons} />
      </div>

      <BulletList icon={AlertOctagon} title="Risks" tone="danger" items={r.risks} />
      <BulletList icon={Lightbulb} title="Alternative options" tone="info" items={r.alternatives} />

      {/* Recommendation */}
      <div className="border border-primary/40 bg-primary/5 rounded-md p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary mb-1">
          <Sparkles className="size-3" /> Recommendation
        </div>
        <p className="text-xs leading-relaxed text-foreground/90">{r.recommendation}</p>
      </div>

      {/* Decision score */}
      <div className={cn("rounded-md border p-2.5 flex items-center gap-3", STATUS_COLOR[r.decisionStatus])}>
        <Gauge className="size-7 shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Decision score</div>
          <div className="text-mono text-2xl leading-tight">{r.decisionScore}<span className="text-xs opacity-70">/100</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider opacity-80">Status</div>
          <div className="text-xs font-medium">{r.decisionStatus}</div>
        </div>
      </div>
    </div>
  );
}

function fmtPct(n: number) {
  return `${n > 0 ? "+" : ""}${n}%`;
}

function Metric({ label, value, tone, wide }: { label: string; value: string; tone: "safe" | "warn" | "danger" | "info"; wide?: boolean }) {
  return (
    <div className={cn("border border-border rounded-md p-2 bg-background/40", wide && "col-span-2")}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <span className={cn("size-1.5 rounded-full", `bg-${tone}`)} />
      </div>
      <div className={cn("text-mono mt-0.5", wide ? "text-xl" : "text-base", `text-${tone}`)}>
        {value}
      </div>
    </div>
  );
}

function BulletList({ icon: Icon, title, tone, items }: { icon: any; title: string; tone: "safe" | "warn" | "danger" | "info"; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="border border-border rounded-md p-2 bg-background/40">
      <div className={cn("flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-1", `text-${tone}`)}>
        <Icon className="size-3" /> {title}
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-[11px] leading-relaxed text-foreground/85 flex gap-1.5">
            <span className={cn("mt-1 size-1 rounded-full shrink-0", `bg-${tone}`)} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
