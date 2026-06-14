import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Route as RouteIcon, Trash2, KeyRound } from "lucide-react";

export type OverlayKind = "none" | "traffic" | "heatmap" | "flood";

export interface RoadFeatureInfo {
  id: string | number;
  name: string;
  class: string;
  type?: string;
  surface?: string;
  lanes?: string;
  maxspeed?: string;
}

interface Props {
  overlay?: OverlayKind;
  onSelectionChange?: (s: { count: number; lastClicked: RoadFeatureInfo | null }) => void;
  drawMode?: "none" | "road" | "route";
  onDrawCreate?: (geojson: GeoJSON.Feature) => void;
  center?: [number, number];
  zoom?: number;
}

const TOKEN_KEY = "urbanverse.mapbox_token";

export function MapboxMap({
  overlay = "none",
  onSelectionChange,
  drawMode = "none",
  onDrawCreate,
  center = [-74.006, 40.7128],
  zoom = 12.2,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const selectedRef = useRef<Set<string | number>>(new Set());
  const [token, setToken] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(TOKEN_KEY) ?? "",
  );
  const [tokenInput, setTokenInput] = useState("");
  const [ready, setReady] = useState(false);

  // Init map
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: drawStyles,
    });
    drawRef.current = draw;
    map.addControl(draw as unknown as mapboxgl.IControl);

    map.on("draw.create", (e: { features: GeoJSON.Feature[] }) => {
      e.features.forEach((f) => onDrawCreate?.(f));
    });

    map.on("load", () => {
      // Highlight layer for selected road segments (uses feature-state)
      map.addLayer({
        id: "uv-road-highlight",
        type: "line",
        source: "composite",
        "source-layer": "road",
        paint: {
          "line-color": "#ef4444",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, 2, 14, 5, 18, 10,
          ],
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 0.95, 0,
          ],
        },
      });

      // Hover layer
      map.addLayer({
        id: "uv-road-hover",
        type: "line",
        source: "composite",
        "source-layer": "road",
        paint: {
          "line-color": "#fbbf24",
          "line-width": 3,
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false], 0.6, 0,
          ],
        },
      });

      setReady(true);
    });

    let hovered: { id: string | number; source: string; sourceLayer: string } | null = null;

    map.on("mousemove", (e) => {
      const feats = map.queryRenderedFeatures(e.point, {
        layers: ["uv-road-hover"],
      });
      if (hovered) {
        map.setFeatureState(hovered, { hover: false });
        hovered = null;
      }
      if (feats.length && feats[0].id != null) {
        const f = feats[0];
        hovered = { id: f.id!, source: "composite", sourceLayer: "road" };
        map.setFeatureState(hovered, { hover: true });
        map.getCanvas().style.cursor = "pointer";
      } else {
        map.getCanvas().style.cursor = "";
      }
    });

    map.on("click", (e) => {
      if (drawModeRef.current !== "none") return;
      const feats = map.queryRenderedFeatures(e.point, {
        layers: ["uv-road-highlight"],
      });
      if (!feats.length || feats[0].id == null) {
        // clear
        selectedRef.current.forEach((id) =>
          map.setFeatureState(
            { id, source: "composite", sourceLayer: "road" },
            { selected: false },
          ),
        );
        selectedRef.current.clear();
        onSelectRoad?.(null);
        return;
      }
      const f = feats[0];
      const id = f.id!;
      const isSel = selectedRef.current.has(id);
      map.setFeatureState(
        { id, source: "composite", sourceLayer: "road" },
        { selected: !isSel },
      );
      if (isSel) selectedRef.current.delete(id);
      else selectedRef.current.add(id);

      const p = f.properties ?? {};
      onSelectRoad?.({
        id,
        name: p.name ?? "Unnamed segment",
        class: p.class ?? "road",
        type: p.type,
        surface: p.surface,
        lanes: p.lanes,
        maxspeed: p.maxspeed,
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Track drawMode without re-init
  const drawModeRef = useRef(drawMode);
  useEffect(() => {
    drawModeRef.current = drawMode;
    const draw = drawRef.current;
    if (!draw) return;
    if (drawMode === "none") {
      try { draw.changeMode("simple_select"); } catch { /* noop */ }
    } else {
      try { draw.changeMode("draw_line_string"); } catch { /* noop */ }
    }
  }, [drawMode]);

  // Overlay management
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const ids = ["uv-overlay-heatmap", "uv-overlay-flood", "uv-overlay-traffic"];
    ids.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("uv-overlay-points")) map.removeSource("uv-overlay-points");
    if (map.getSource("uv-overlay-flood")) map.removeSource("uv-overlay-flood");

    if (overlay === "heatmap") {
      map.addSource("uv-overlay-points", {
        type: "geojson",
        data: randomPoints(center, 350, 0.06),
      });
      map.addLayer({
        id: "uv-overlay-heatmap",
        type: "heatmap",
        source: "uv-overlay-points",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "w"], 0, 0, 1, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 1, 15, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgba(34,197,94,0.5)",
            0.5, "rgba(251,191,36,0.7)",
            0.8, "rgba(239,68,68,0.85)",
            1, "rgba(239,68,68,1)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 12, 15, 40],
          "heatmap-opacity": 0.75,
        },
      });
    } else if (overlay === "flood") {
      map.addSource("uv-overlay-flood", {
        type: "geojson",
        data: floodPolygons(center),
      });
      map.addLayer({
        id: "uv-overlay-flood",
        type: "fill",
        source: "uv-overlay-flood",
        paint: {
          "fill-color": [
            "match", ["get", "risk"],
            "high", "#ef4444",
            "med", "#fb923c",
            "#22c55e",
          ],
          "fill-opacity": 0.35,
          "fill-outline-color": "#0ea5e9",
        },
      });
    } else if (overlay === "traffic") {
      map.addLayer({
        id: "uv-overlay-traffic",
        type: "line",
        source: "composite",
        "source-layer": "road",
        filter: ["in", "class", "motorway", "trunk", "primary", "secondary", "tertiary"],
        paint: {
          "line-color": [
            "match", ["get", "class"],
            "motorway", "#ef4444",
            "trunk", "#f97316",
            "primary", "#fbbf24",
            "secondary", "#22c55e",
            "#22c55e",
          ],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, 1.2, 14, 3, 18, 6,
          ],
          "line-opacity": 0.7,
        },
      }, "uv-road-highlight");
    }
  }, [overlay, ready, center]);

  if (!token) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-background p-6">
        <div className="panel-surface rounded-md p-5 max-w-md w-full">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="size-4 text-primary" />
            <div className="text-sm font-medium">Mapbox token required</div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Paste your Mapbox public token (starts with <code className="text-mono">pk.</code>). Get one free at{" "}
            <a className="text-info underline" href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer">
              account.mapbox.com
            </a>. Stored locally in this browser.
          </p>
          <div className="flex gap-2">
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1Ijoi…"
              className="text-mono text-xs"
            />
            <Button
              size="sm"
              disabled={!tokenInput.startsWith("pk.")}
              onClick={() => {
                localStorage.setItem(TOKEN_KEY, tokenInput.trim());
                setToken(tokenInput.trim());
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="absolute inset-0" />;
}

// Drawing toolbar (lives outside the map for layout flexibility)
export function MapDrawToolbar({
  mode, setMode, onClear,
}: {
  mode: "none" | "road" | "route";
  setMode: (m: "none" | "road" | "route") => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setMode(mode === "road" ? "none" : "road")}
        className={btnCls(mode === "road")}
      >
        <Pencil className="size-3.5" /> Draw road
      </button>
      <button
        onClick={() => setMode(mode === "route" ? "none" : "route")}
        className={btnCls(mode === "route")}
      >
        <RouteIcon className="size-3.5" /> Create route
      </button>
      <button onClick={onClear} className={btnCls(false)}>
        <Trash2 className="size-3.5" /> Clear
      </button>
    </div>
  );
}

function btnCls(active: boolean) {
  return (
    "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors " +
    (active
      ? "bg-primary/15 border-primary/50 text-foreground"
      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/40")
  );
}

// --- helpers -------------------------------------------------------------

function randomPoints(
  [lng, lat]: [number, number],
  count: number,
  spread: number,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < count; i++) {
    // cluster a bit toward center using two random draws
    const dx = (Math.random() - 0.5 + (Math.random() - 0.5)) * spread;
    const dy = (Math.random() - 0.5 + (Math.random() - 0.5)) * spread;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng + dx, lat + dy] },
      properties: { w: Math.random() * 0.8 + 0.2 },
    });
  }
  return { type: "FeatureCollection", features };
}

function floodPolygons([lng, lat]: [number, number]): GeoJSON.FeatureCollection {
  const make = (cx: number, cy: number, r: number, risk: string) => {
    const pts: [number, number][] = [];
    const sides = 14;
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const jitter = 0.7 + Math.random() * 0.6;
      pts.push([cx + Math.cos(a) * r * jitter, cy + Math.sin(a) * r * jitter]);
    }
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [pts] },
      properties: { risk },
    };
  };
  return {
    type: "FeatureCollection",
    features: [
      make(lng - 0.018, lat - 0.012, 0.014, "high"),
      make(lng + 0.022, lat + 0.008, 0.018, "med"),
      make(lng - 0.005, lat + 0.024, 0.012, "med"),
      make(lng + 0.03, lat - 0.02, 0.01, "high"),
      make(lng - 0.035, lat + 0.005, 0.016, "low"),
    ],
  };
}

const drawStyles = [
  {
    id: "gl-draw-line",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"]],
    paint: { "line-color": "#3b82f6", "line-width": 3, "line-dasharray": [2, 1] },
  },
  {
    id: "gl-draw-polygon-and-line-vertex-active",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
    paint: { "circle-radius": 4, "circle-color": "#3b82f6" },
  },
];
