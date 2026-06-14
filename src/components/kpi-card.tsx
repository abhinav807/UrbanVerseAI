import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Trend = "up" | "down" | "flat";

export function KpiCard({
  label,
  value,
  unit,
  delta,
  trend = "flat",
  status = "info",
  spark,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  trend?: Trend;
  status?: "safe" | "warn" | "danger" | "info";
  spark?: number[];
}) {
  const statusColor = {
    safe: "text-safe",
    warn: "text-warn",
    danger: "text-danger",
    info: "text-info",
  }[status];

  const trendSym = trend === "up" ? "▲" : trend === "down" ? "▼" : "■";

  return (
    <div className="panel-surface rounded-md p-3.5 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        <span className={cn("size-1.5 rounded-full", `bg-${status}`)} />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <div className="text-mono text-2xl font-medium tracking-tight">{value}</div>
        {unit && (
          <div className="text-xs text-muted-foreground text-mono">{unit}</div>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between">
        {delta && (
          <div className={cn("text-[11px] text-mono", statusColor)}>
            {trendSym} {delta}
          </div>
        )}
        {spark && <Sparkline data={spark} className={statusColor} />}
      </div>
    </div>
  );
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 80;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className={cn("opacity-90", className)}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        points={pts}
      />
    </svg>
  );
}

export function PanelHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {subtitle}
        </div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      {right}
    </div>
  );
}
