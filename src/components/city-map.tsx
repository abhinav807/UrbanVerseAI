import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Procedural city road network — deterministic.
export type Road = {
  id: string;
  x1: number; y1: number; x2: number; y2: number;
  type: "highway" | "arterial" | "street";
  load: number; // 0-1
};

export type Risk = "safe" | "warn" | "danger";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateNetwork(seed = 7): Road[] {
  const r = rng(seed);
  const roads: Road[] = [];
  // Highways (curved arterials across the map)
  for (let i = 0; i < 3; i++) {
    const y = 120 + i * 180 + r() * 40;
    roads.push({
      id: `h-${i}`, x1: 0, y1: y, x2: 1200, y2: y + (r() - 0.5) * 60,
      type: "highway", load: 0.55 + r() * 0.35,
    });
  }
  for (let i = 0; i < 3; i++) {
    const x = 200 + i * 320 + r() * 60;
    roads.push({
      id: `hv-${i}`, x1: x, y1: 0, x2: x + (r() - 0.5) * 60, y2: 720,
      type: "highway", load: 0.5 + r() * 0.35,
    });
  }
  // Arterial grid
  for (let i = 0; i < 7; i++) {
    const y = 60 + i * 95;
    roads.push({
      id: `a-h-${i}`, x1: 20, y1: y, x2: 1180, y2: y + (r() - 0.5) * 18,
      type: "arterial", load: 0.3 + r() * 0.5,
    });
  }
  for (let i = 0; i < 10; i++) {
    const x = 60 + i * 115;
    roads.push({
      id: `a-v-${i}`, x1: x, y1: 20, x2: x + (r() - 0.5) * 18, y2: 700,
      type: "arterial", load: 0.25 + r() * 0.55,
    });
  }
  // Streets (short segments)
  for (let i = 0; i < 80; i++) {
    const x = 40 + r() * 1120;
    const y = 40 + r() * 660;
    const horiz = r() > 0.5;
    const len = 40 + r() * 70;
    roads.push({
      id: `s-${i}`,
      x1: x, y1: y,
      x2: horiz ? x + len : x,
      y2: horiz ? y : y + len,
      type: "street",
      load: r() * 0.6,
    });
  }
  return roads;
}

function loadColor(load: number) {
  if (load < 0.4) return "var(--color-safe)";
  if (load < 0.7) return "var(--color-warn)";
  return "var(--color-danger)";
}

export function CityMap({
  selectable = false,
  selected = new Set<string>(),
  onToggle,
  overlay = "traffic",
  className,
  animated = true,
}: {
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  overlay?: "traffic" | "flood" | "growth" | "stress" | "none";
  className?: string;
  animated?: boolean;
}) {
  const roads = useMemo(() => generateNetwork(11), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const i = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(i);
  }, [animated]);

  const riskZones = useMemo(() => {
    const r = rng(overlay.length + 3);
    return Array.from({ length: 7 }, (_, i) => ({
      id: i,
      cx: 80 + r() * 1040,
      cy: 60 + r() * 600,
      rx: 80 + r() * 130,
      ry: 60 + r() * 110,
      level: r(),
    }));
  }, [overlay]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-background", className)}>
      {/* Scan grid */}
      <div className="absolute inset-0 scan-grid opacity-40" />
      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 0%, transparent 55%, oklch(0.14 0.01 240 / 0.6) 100%)",
        }}
      />

      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Water / parks blobs for texture */}
        <defs>
          <radialGradient id="water" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.32 0.05 230 / 0.6)" />
            <stop offset="100%" stopColor="oklch(0.22 0.02 240 / 0)" />
          </radialGradient>
          <radialGradient id="riskGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="950" cy="600" rx="280" ry="160" fill="url(#water)" />
        <ellipse cx="180" cy="120" rx="160" ry="90" fill="url(#water)" opacity="0.6" />

        {/* Risk overlay */}
        {overlay !== "none" &&
          riskZones.map((z) => {
            const color =
              z.level > 0.66
                ? "var(--color-danger)"
                : z.level > 0.33
                  ? "var(--color-warn)"
                  : "var(--color-safe)";
            return (
              <g key={z.id} style={{ color }}>
                <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill="url(#riskGrad)" />
              </g>
            );
          })}

        {/* Roads */}
        {roads.map((r) => {
          const isSelected = selected.has(r.id);
          const stroke = isSelected ? "var(--color-danger)" : loadColor(r.load);
          const width =
            r.type === "highway" ? 3.5 : r.type === "arterial" ? 2 : 1;
          const opacity =
            r.type === "highway" ? 1 : r.type === "arterial" ? 0.85 : 0.5;
          return (
            <line
              key={r.id}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              stroke={stroke}
              strokeWidth={isSelected ? width + 1.5 : width}
              strokeLinecap="round"
              opacity={opacity}
              className={cn(
                selectable && r.type !== "street" && "cursor-pointer hover:opacity-100",
                isSelected && "drop-shadow-[0_0_6px_var(--color-danger)]",
              )}
              onClick={() => selectable && r.type !== "street" && onToggle?.(r.id)}
            />
          );
        })}

        {/* Pulse markers (sensors) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const r = rng(i + 5 + tick * 0);
          const cx = 60 + r() * 1080;
          const cy = 40 + r() * 640;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="2" fill="var(--color-primary)" />
              <circle
                cx={cx}
                cy={cy}
                r="2"
                fill="none"
                stroke="var(--color-primary)"
                opacity="0.6"
              >
                <animate attributeName="r" from="2" to="14" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* HUD corners */}
      <div className="absolute top-3 left-3 text-mono text-[10px] text-muted-foreground space-y-0.5 pointer-events-none">
        <div>LAT 40.7128° N</div>
        <div>LON 74.0060° W</div>
        <div>ZOOM 12.4</div>
      </div>
      <div className="absolute top-3 right-3 text-mono text-[10px] text-muted-foreground text-right pointer-events-none">
        <div>LAYER · {overlay.toUpperCase()}</div>
        <div>TILESET · URBAN-V4</div>
        <div className="text-safe">● LIVE</div>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-mono text-[10px] text-muted-foreground">
        <Legend swatch="safe" label="Low" />
        <Legend swatch="warn" label="Moderate" />
        <Legend swatch="danger" label="High" />
      </div>
      <div className="absolute bottom-3 right-3 text-mono text-[10px] text-muted-foreground">
        © UrbanVerse · OSM-derived
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: "safe" | "warn" | "danger"; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-sm", `bg-${swatch}`)} />
      {label}
    </span>
  );
}
