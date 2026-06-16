import { cn } from "@/lib/utils";
import { HORIZONS, type HorizonKey } from "@/lib/delhi-data";
import { Clock } from "lucide-react";

export function TimelineSlider({
  value,
  onChange,
  className,
}: {
  value: HorizonKey;
  onChange: (v: HorizonKey) => void;
  className?: string;
}) {
  const idx = HORIZONS.findIndex((h) => h.key === value);
  return (
    <div className={cn("panel-surface rounded-md p-2 shadow-lg backdrop-blur-sm bg-panel/95", className)}>
      <div className="flex items-center gap-2 mb-1.5">
        <Clock className="size-3 text-primary" />
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Time horizon
        </span>
        <span className="ml-auto text-mono text-[10px] text-foreground">
          {HORIZONS[idx]?.label ?? "Present"}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={HORIZONS.length - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(HORIZONS[+e.target.value].key)}
        className="w-56 accent-primary cursor-pointer"
      />
      <div className="flex justify-between mt-1 px-0.5">
        {HORIZONS.map((h, i) => (
          <button
            key={h.key}
            onClick={() => onChange(h.key)}
            className={cn(
              "text-[9px] text-mono px-0.5 transition-colors",
              i === idx ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {h.key === "now" ? "Now" : h.label.replace("+", "")}
          </button>
        ))}
      </div>
    </div>
  );
}
