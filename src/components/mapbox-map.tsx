// MapLibre GL + OpenStreetMap-based implementation, focused on Delhi NCR.
// Filename kept for backward compatibility — exports MapboxMap/MapDrawToolbar names.
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, MapGeoJSONFeature, MapMouseEvent } from "maplibre-gl";
import type * as GJ from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { Pencil, Route as RouteIcon, Trash2 } from "lucide-react";
import {
  DELHI_CENTER, DELHI_ZOOM, ALL_POIS, FLOOD_ZONES, type FlyToDetail,
} from "@/lib/delhi-data";

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
  onDrawCreate?: (geojson: GJ.Feature) => void;
  center?: [number, number];
  zoom?: number;
  showPois?: boolean;
}

// OpenFreeMap — free, no-API-key vector tiles based on OpenStreetMap (OpenMapTiles schema).
// Roads live in source-layer "transportation".
const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const ROAD_SOURCE = "openmaptiles";
const ROAD_SOURCE_LAYER = "transportation";

const emptyFC: GJ.FeatureCollection = { type: "FeatureCollection", features: [] };

export function MapboxMap({
  overlay = "none",
  onSelectionChange,
  drawMode = "none",
  onDrawCreate,
  center = DELHI_CENTER,
  zoom = DELHI_ZOOM,
  showPois = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const selectedRef = useRef<Map<string, GJ.Feature>>(new Map());
  const drawCoordsRef = useRef<[number, number][]>([]);
  const drawModeRef = useRef(drawMode);
  const [ready, setReady] = useState(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center,
        zoom,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("error", (e) => console.warn("[uv-map]", e?.error ?? e));

      // Force resize once container is laid out / when it changes size.
      const ro = new ResizeObserver(() => {
        try { map.resize(); } catch { /* noop */ }
      });
      ro.observe(containerRef.current);
      requestAnimationFrame(() => { try { map.resize(); } catch { /* noop */ } });


      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "© OpenStreetMap contributors · OpenFreeMap",
        }),
      );


      map.on("load", () => {
        // Sources for selection/hover/draw highlight (GeoJSON because OMT tiles lack stable ids)
        map.addSource("uv-selected-roads", { type: "geojson", data: emptyFC });
        map.addSource("uv-hover-road", { type: "geojson", data: emptyFC });
        map.addSource("uv-draw-lines", { type: "geojson", data: emptyFC });
        map.addSource("uv-draw-progress", { type: "geojson", data: emptyFC });
        map.addSource("uv-draw-vertices", { type: "geojson", data: emptyFC });

        map.addLayer({
          id: "uv-road-hover",
          type: "line",
          source: "uv-hover-road",
          paint: {
            "line-color": "#fbbf24",
            "line-width": 3,
            "line-opacity": 0.6,
          },
        });
        map.addLayer({
          id: "uv-road-highlight",
          type: "line",
          source: "uv-selected-roads",
          paint: {
            "line-color": "#ef4444",
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              10, 2, 14, 5, 18, 10,
            ],
            "line-opacity": 0.95,
          },
        });

        // Draw layers
        map.addLayer({
          id: "uv-draw-lines",
          type: "line",
          source: "uv-draw-lines",
          paint: {
            "line-color": ["case", ["==", ["get", "kind"], "route"], "#22d3ee", "#3b82f6"],
            "line-width": 3,
            "line-dasharray": [2, 1],
          },
        });
        map.addLayer({
          id: "uv-draw-progress",
          type: "line",
          source: "uv-draw-progress",
          paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [1, 1] },
        });
        map.addLayer({
          id: "uv-draw-vertices",
          type: "circle",
          source: "uv-draw-vertices",
          paint: { "circle-radius": 4, "circle-color": "#3b82f6", "circle-stroke-color": "#fff", "circle-stroke-width": 1 },
        });

        // POI overlay (Delhi metro/hospitals/schools/govt/landmarks)
        map.addSource("uv-pois", {
          type: "geojson",
          data: poiFeatureCollection(),
        });
        map.addLayer({
          id: "uv-pois-circles",
          type: "circle",
          source: "uv-pois",
          layout: { visibility: showPois ? "visible" : "none" },
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              9, 2.5, 12, 4.5, 16, 8,
            ],
            "circle-color": [
              "match", ["get", "kind"],
              "metro", "#22d3ee",
              "hospital", "#ef4444",
              "school", "#fbbf24",
              "govt", "#a78bfa",
              "#22c55e",
            ],
            "circle-stroke-color": "#0b1220",
            "circle-stroke-width": 1.2,
            "circle-opacity": 0.95,
          },
        });
        map.addLayer({
          id: "uv-pois-labels",
          type: "symbol",
          source: "uv-pois",
          minzoom: 12.5,
          layout: {
            "text-field": ["get", "name"],
            "text-size": 10,
            "text-offset": [0, 1.1],
            "text-anchor": "top",
            "text-font": ["Noto Sans Regular"],
          },
          paint: {
            "text-color": "#e5e7eb",
            "text-halo-color": "#0b1220",
            "text-halo-width": 1.2,
          },
        });

        setReady(true);
      });

      // Hover
      map.on("mousemove", (e) => {
        if (drawModeRef.current !== "none") {
          // show in-progress line to cursor
          const coords = drawCoordsRef.current;
          if (coords.length > 0) {
            const src = map.getSource("uv-draw-progress") as maplibregl.GeoJSONSource;
            src?.setData({
              type: "FeatureCollection",
              features: [{
                type: "Feature",
                geometry: { type: "LineString", coordinates: [...coords, [e.lngLat.lng, e.lngLat.lat]] },
                properties: {},
              }],
            });
          }
          map.getCanvas().style.cursor = "crosshair";
          return;
        }
        const feats = roadFeaturesAt(map, e.point);
        const hoverSrc = map.getSource("uv-hover-road") as maplibregl.GeoJSONSource;
        if (feats.length) {
          hoverSrc?.setData({ type: "FeatureCollection", features: [feats[0]] });
          map.getCanvas().style.cursor = "pointer";
        } else {
          hoverSrc?.setData(emptyFC);
          map.getCanvas().style.cursor = "";
        }
      });

      map.on("click", (e: MapMouseEvent) => {
        if (drawModeRef.current !== "none") {
          drawCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
          const vSrc = map.getSource("uv-draw-vertices") as maplibregl.GeoJSONSource;
          vSrc?.setData({
            type: "FeatureCollection",
            features: drawCoordsRef.current.map((c) => ({
              type: "Feature", geometry: { type: "Point", coordinates: c }, properties: {},
            })),
          });
          return;
        }

        const feats = roadFeaturesAt(map, e.point);
        if (!feats.length) {
          selectedRef.current.clear();
          (map.getSource("uv-selected-roads") as maplibregl.GeoJSONSource)?.setData(emptyFC);
          onSelectionChange?.({ count: 0, lastClicked: null });
          return;
        }
        const f = feats[0];
        const key = featureKey(f);
        if (selectedRef.current.has(key)) selectedRef.current.delete(key);
        else selectedRef.current.set(key, f);

        (map.getSource("uv-selected-roads") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: Array.from(selectedRef.current.values()),
        });

        const p = (f.properties ?? {}) as Record<string, any>;
        const info: RoadFeatureInfo = {
          id: key,
          name: p.name ?? p["name:latin"] ?? "Unnamed segment",
          class: p.class ?? "road",
          type: p.subclass ?? p.type,
          surface: p.surface,
          lanes: p.lanes != null ? String(p.lanes) : undefined,
          maxspeed: p.maxspeed,
        };
        onSelectionChange?.({ count: selectedRef.current.size, lastClicked: info });
      });

      // Double-click commits the in-progress drawing
      map.on("dblclick", (e) => {
        if (drawModeRef.current === "none") return;
        e.preventDefault();
        const coords = drawCoordsRef.current;
        if (coords.length < 2) {
          drawCoordsRef.current = [];
          return;
        }
        const feature: GJ.Feature = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
          properties: { kind: drawModeRef.current },
        };
        const linesSrc = map.getSource("uv-draw-lines") as maplibregl.GeoJSONSource;
        // append by reading current; we don't keep state — emit out and let parent re-mount if needed
        const current = (linesSrc as any)._data as GJ.FeatureCollection | undefined;
        const next: GJ.FeatureCollection = {
          type: "FeatureCollection",
          features: [...(current?.features ?? []), feature],
        };
        linesSrc?.setData(next);
        (map.getSource("uv-draw-progress") as maplibregl.GeoJSONSource)?.setData(emptyFC);
        (map.getSource("uv-draw-vertices") as maplibregl.GeoJSONSource)?.setData(emptyFC);
        drawCoordsRef.current = [];
        onDrawCreate?.(feature);
      });

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        setReady(false);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track drawMode without re-init
  useEffect(() => {
    drawModeRef.current = drawMode;
    if (drawMode === "none") {
      drawCoordsRef.current = [];
      const map = mapRef.current;
      if (map) {
        (map.getSource("uv-draw-progress") as maplibregl.GeoJSONSource | undefined)?.setData(emptyFC);
        (map.getSource("uv-draw-vertices") as maplibregl.GeoJSONSource | undefined)?.setData(emptyFC);
      }
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
        data: delhiFloodPolygons(),
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
      // Color-tint major roads from the OpenMapTiles transportation layer.
      map.addLayer(
        {
          id: "uv-overlay-traffic",
          type: "line",
          source: ROAD_SOURCE,
          "source-layer": ROAD_SOURCE_LAYER,
          filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]]],
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
        },
        "uv-road-hover",
      );
    }
  }, [overlay, ready, center]);

  // Toggle POI layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const vis = showPois ? "visible" : "none";
    if (map.getLayer("uv-pois-circles")) map.setLayoutProperty("uv-pois-circles", "visibility", vis);
    if (map.getLayer("uv-pois-labels")) map.setLayoutProperty("uv-pois-labels", "visibility", vis);
  }, [showPois, ready]);

  // Cross-component fly-to bus (AI Planner → map)
  useEffect(() => {
    const handler = (e: Event) => {
      const map = mapRef.current;
      if (!map) return;
      const d = (e as CustomEvent<FlyToDetail>).detail;
      if (!d) return;
      map.flyTo({ center: [d.lng, d.lat], zoom: d.zoom ?? 14.5, speed: 1.2 });
    };
    window.addEventListener("uv:flyTo", handler);
    return () => window.removeEventListener("uv:flyTo", handler);
  }, []);

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

function roadFeaturesAt(map: MlMap, point: { x: number; y: number }): MapGeoJSONFeature[] {
  // Tolerance box to make thin road lines easier to click
  const b = 4;
  const bbox: [[number, number], [number, number]] = [
    [point.x - b, point.y - b],
    [point.x + b, point.y + b],
  ];
  try {
    return map.queryRenderedFeatures(bbox, {
      // Filter by sourceLayer to grab the road network from the basemap style
      filter: ["all"],
    }).filter((f) => f.sourceLayer === ROAD_SOURCE_LAYER && f.geometry.type !== "Point");
  } catch {
    return [];
  }
}

function featureKey(f: MapGeoJSONFeature): string {
  const p = (f.properties ?? {}) as Record<string, any>;
  if (f.id != null) return String(f.id);
  // Fallback: name+class+first coord
  const g = f.geometry as any;
  const c = g?.coordinates?.[0];
  const coord = Array.isArray(c) ? (Array.isArray(c[0]) ? c[0] : c) : null;
  return `${p.name ?? p.class ?? "road"}@${coord ? coord.join(",") : Math.random().toString(36).slice(2)}`;
}

function randomPoints(
  [lng, lat]: [number, number],
  count: number,
  spread: number,
): GJ.FeatureCollection {
  const features: GJ.Feature[] = [];
  for (let i = 0; i < count; i++) {
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

function floodPolygons([lng, lat]: [number, number]): GJ.FeatureCollection {
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

// Re-import for inner type usage in setData callbacks
import type maplibregl from "maplibre-gl";
