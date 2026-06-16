// Centralised Delhi simulation engine.
// All scenario maths live here so simulator, AI planner and reports stay in sync.
import type { FeatureCollection, Feature } from "geojson";
import {
  ALL_POIS, HOSPITALS, SCHOOLS, METRO_STATIONS,
  FIRE_STATIONS, POLICE_STATIONS, FLOOD_ZONES,
  haversineKm, nearest, horizonFactors, type HorizonKey,
} from "./delhi-data";

export type Action = "block" | "extend" | "repair" | "build";

export type Point = { lng: number; lat: number };

export type EmergencyImpact = {
  service: "Hospital" | "Fire" | "Police";
  name: string;
  km: number;
  currentMin: number;
  projectedMin: number;
  deltaMin: number;
  status: "safe" | "warn" | "danger";
};

export type ImpactReport = {
  action: Action;
  horizon: HorizonKey;
  roadClass: string | null;
  // Headline metrics (% deltas vs baseline, +ve = worse)
  trafficDelta: number;
  travelTimeDelta: number;
  nearbyCongestion: number;
  floodRiskDelta: number;
  infraStressDelta: number;
  emergencyDelay: number; // minutes
  population: number;
  // Projected (horizon-scaled absolute values for display)
  projectedTrafficIndex: number;
  projectedPopulation: number;
  projectedFloodRisk: number;
  projectedEmergencyMin: number;
  // Context
  context: { hospitals: number; schools: number; metros: number; pois: number; floodKm: number };
  // Per-service emergency analysis
  emergency: EmergencyImpact[];
  // Decision
  decisionScore: number;
  decisionStatus: "Proceed" | "Proceed with Conditions" | "Reconsider" | "Reject";
  pros: string[];
  cons: string[];
  risks: string[];
  alternatives: string[];
  recommendation: string;
};

const ROAD_CLASS_W: Record<string, number> = {
  motorway: 1.7, trunk: 1.5, primary: 1.3, secondary: 1.05, tertiary: 0.85,
  residential: 0.6, service: 0.4, unclassified: 0.6,
};
const DIR: Record<Action, number> = { block: 1, extend: -0.6, repair: -0.3, build: -0.8 };

function nearbyCounts(p: Point | null, radiusKm = 1.5) {
  if (!p) return { hospitals: 0, schools: 0, metros: 0, pois: 0, floodKm: Infinity };
  const within = (l: typeof ALL_POIS) => l.filter((q) => haversineKm(p, q) <= radiusKm).length;
  const flood = nearest(p, FLOOD_ZONES.map((f) => ({ name: f.name, lng: f.lng, lat: f.lat, risk: f.risk })));
  return {
    hospitals: within(HOSPITALS),
    schools: within(SCHOOLS),
    metros: within(METRO_STATIONS),
    pois: within(ALL_POIS),
    floodKm: flood?.km ?? Infinity,
  };
}

const SPEED_KMPH = { Hospital: 38, Fire: 45, Police: 50 } as const;
function travelMin(km: number, svc: keyof typeof SPEED_KMPH) {
  return +((km / SPEED_KMPH[svc]) * 60).toFixed(1);
}

function emergencyAnalysis(p: Point | null, action: Action, classW: number, horizon: HorizonKey): EmergencyImpact[] {
  if (!p) return [];
  const hf = horizonFactors(horizon);
  const dir = DIR[action];
  // Block adds detour penalty proportional to road weight; build/repair reduces.
  const detourFactor = 1 + dir * classW * 0.18 * hf.emergencyMul;
  const services: Array<{ key: "Hospital" | "Fire" | "Police"; list: typeof HOSPITALS }> = [
    { key: "Hospital", list: HOSPITALS },
    { key: "Fire", list: FIRE_STATIONS },
    { key: "Police", list: POLICE_STATIONS },
  ];
  return services.map(({ key, list }) => {
    const n = nearest(p, list)!;
    const current = travelMin(n.km, key);
    const projected = +(current * Math.max(detourFactor, 0.5)).toFixed(1);
    const delta = +(projected - current).toFixed(1);
    const status: EmergencyImpact["status"] = delta <= -0.2 ? "safe" : delta <= 1.5 ? "warn" : "danger";
    return { service: key, name: n.item.name, km: +n.km.toFixed(2), currentMin: current, projectedMin: projected, deltaMin: delta, status };
  });
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export function computeImpact(
  point: Point | null,
  action: Action,
  horizon: HorizonKey = "now",
  roadClass: string | null = null,
): ImpactReport {
  const hf = horizonFactors(horizon);
  const ctx = nearbyCounts(point);
  const classW = roadClass ? ROAD_CLASS_W[roadClass] ?? 0.6 : 1.0;
  const dir = DIR[action];
  const connectivity = 1 + ctx.metros * 0.15 + ctx.pois * 0.018;

  const trafficDelta = +(5.4 * dir * classW * connectivity * hf.trafficMul).toFixed(1);
  const travelTimeDelta = +(2.1 * dir * classW * hf.trafficMul).toFixed(1);
  const nearbyCongestion = +(4.3 * dir * classW * connectivity).toFixed(1);
  const floodProx = ctx.floodKm < 1.5 ? (1.5 - ctx.floodKm) / 1.5 : 0;
  const floodRiskDelta = +(floodProx * 6 * hf.floodMul * (action === "build" ? 1.4 : action === "block" ? -0.2 : 1)).toFixed(1);
  const infraStressDelta = +(3.2 * Math.abs(dir) * classW * hf.stressMul * (action === "repair" ? -1 : 1)).toFixed(1);
  const emergencyDelay = +(0.7 * Math.max(dir, 0.2) * classW * (1 + ctx.hospitals * 0.18) * hf.emergencyMul).toFixed(2);
  const population = Math.round((5200 + ctx.schools * 1800 + ctx.metros * 4600 + (action === "block" ? 6800 : 0)) * Math.max(0.4, classW) * hf.popMul);

  const emergency = emergencyAnalysis(point, action, classW, horizon);

  const projectedTrafficIndex = +clamp(72 + trafficDelta * 0.6 * hf.trafficMul, 10, 100).toFixed(1);
  const projectedPopulation = Math.round(population * 1);
  const projectedFloodRisk = +clamp(28 + floodRiskDelta * 1.5, 0, 100).toFixed(1);
  const projectedEmergencyMin = +(emergency.reduce((s, e) => s + e.projectedMin, 0) / Math.max(emergency.length, 1)).toFixed(1);

  // Decision scoring — 0..100, higher = better outcome.
  const penalty =
    Math.max(0, trafficDelta) * 0.8 +
    Math.max(0, emergencyDelay * 6) +
    Math.max(0, floodRiskDelta * 0.5) +
    Math.max(0, infraStressDelta * 0.4) +
    Math.max(0, nearbyCongestion) * 0.4;
  const benefit =
    Math.max(0, -trafficDelta) * 0.9 +
    Math.max(0, -nearbyCongestion) * 0.5 +
    Math.max(0, -infraStressDelta) * 0.6 +
    (action === "repair" ? 8 : action === "build" ? 10 : action === "extend" ? 6 : 0);
  const decisionScore = Math.round(clamp(72 - penalty + benefit, 5, 98));
  const decisionStatus: ImpactReport["decisionStatus"] =
    decisionScore >= 80 ? "Proceed" :
    decisionScore >= 60 ? "Proceed with Conditions" :
    decisionScore >= 40 ? "Reconsider" : "Reject";

  const { pros, cons, risks, alternatives, recommendation } = narrative(action, classW, ctx, emergency, decisionScore);

  return {
    action, horizon, roadClass,
    trafficDelta, travelTimeDelta, nearbyCongestion,
    floodRiskDelta, infraStressDelta, emergencyDelay, population,
    projectedTrafficIndex, projectedPopulation, projectedFloodRisk, projectedEmergencyMin,
    context: ctx, emergency,
    decisionScore, decisionStatus,
    pros, cons, risks, alternatives, recommendation,
  };
}

function narrative(
  action: Action,
  classW: number,
  ctx: ReturnType<typeof nearbyCounts>,
  emergency: EmergencyImpact[],
  score: number,
) {
  const isMajor = classW >= 1.2;
  const proxFlood = ctx.floodKm < 1.0;
  const worstEmerg = emergency.reduce((m, e) => (e.deltaMin > m ? e.deltaMin : m), 0);

  const pros: string[] = [];
  const cons: string[] = [];
  const risks: string[] = [];
  const alternatives: string[] = [];

  if (action === "block") {
    pros.push("Enables targeted maintenance / safety works", "Reduces wear on damaged surface", "Forces traffic onto under-utilised parallel corridors");
    cons.push("Higher peak-hour congestion on nearby arterials", "Commuter disruption for residents in catchment", `Adds detour load to ${ctx.metros} metro feeder roads`);
    risks.push("Peak-hour gridlock at junctions", "Ambulance and fire response delays", "Spillover congestion into residential lanes");
    alternatives.push("Partial lane closure (1 of 2 carriageways)", "Night-time closure 23:00–05:00", "Phased weekend closures with diversion signage");
  } else if (action === "repair") {
    pros.push("Restores design capacity of segment", "Reduces accident rate and pothole risk", "Extends asset life by 8–12 years");
    cons.push("Short-term lane reduction during works", "Material logistics traffic in catchment");
    risks.push("Weather delays during monsoon", "Cost overrun on subgrade repair");
    alternatives.push("Mill-and-overlay only (faster, shorter life)", "Full depth reconstruction (slower, longer life)");
  } else if (action === "extend") {
    pros.push("Improves connectivity to adjacent network", "Reduces travel time on parallel routes", "Distributes load across more corridors");
    cons.push("Land acquisition cost / displacement risk", "Construction-phase congestion");
    risks.push("Induced demand may absorb new capacity", "Drainage retrofit needed near floodplain");
    alternatives.push("Bus-priority lane instead of general traffic", "Cycle / pedestrian extension only");
  } else {
    pros.push("Opens up new development corridor", "Provides redundant emergency route", "Relieves load on overloaded primary roads");
    cons.push("Capital cost and multi-year build window", "Permanent change to urban footprint");
    risks.push("Cost overrun risk for greenfield construction", "May intersect protected land or floodplain");
    alternatives.push("Upgrade existing parallel road instead", "Build as elevated corridor to limit footprint");
  }

  if (proxFlood) risks.push("Asset sits within 1 km of Yamuna flood-prone belt");
  if (isMajor && action === "block") risks.push("Closes a primary arterial — region-wide impact");
  if (worstEmerg > 2.5) risks.push(`Emergency access penalty of +${worstEmerg.toFixed(1)} min on the nearest critical service`);

  let recommendation: string;
  if (score >= 80) recommendation = "Proceed as planned — model shows net-positive urban outcome.";
  else if (score >= 60) recommendation = action === "block"
    ? "Do not fully block during peak hours. Preferred implementation: night closure between 23:00 and 05:00, with electronic diversion signage on the two nearest arterials."
    : "Proceed with phased rollout and continuous monitoring of nearby congestion and emergency response times.";
  else if (score >= 40) recommendation = "Reconsider scope — explore lighter alternatives such as partial closure or off-peak works before committing.";
  else recommendation = "Do not proceed under current configuration. Network impact and emergency penalty exceed acceptable thresholds.";

  return { pros, cons, risks, alternatives, recommendation };
}

// ─── Traffic propagation ──────────────────────────────────────────────────────
// Synthesise 8 radial road segments around the click and assign a delta % so
// the map can paint connected roads by projected load change.
export function buildPropagationFC(
  point: Point | null,
  action: Action,
  horizon: HorizonKey = "now",
  roadClass: string | null = null,
): FeatureCollection {
  if (!point) return { type: "FeatureCollection", features: [] };
  const hf = horizonFactors(horizon);
  const classW = roadClass ? ROAD_CLASS_W[roadClass] ?? 0.6 : 1.0;
  const dir = DIR[action];
  // ~250–700 m radial segments around the focal point
  const baseR = 0.0028; // ~310 m
  const features: Feature[] = [];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  angles.forEach((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const r1 = baseR * (0.45 + (i % 3) * 0.2);
    const r2 = baseR * (1.4 + (i % 4) * 0.35);
    const start: [number, number] = [
      point.lng + Math.cos(rad) * r1 / Math.cos((point.lat * Math.PI) / 180),
      point.lat + Math.sin(rad) * r1,
    ];
    const end: [number, number] = [
      point.lng + Math.cos(rad) * r2 / Math.cos((point.lat * Math.PI) / 180),
      point.lat + Math.sin(rad) * r2,
    ];
    // Direction-of-flow: opposite-side corridors absorb the diverted traffic
    // for "block", and benefit from "build/extend/repair".
    const side = Math.cos(rad - Math.PI / 6); // -1..1
    const magnitude = (12 + i * 2.4) * classW * hf.trafficMul;
    let delta: number;
    if (action === "block") delta = +(magnitude * (0.4 + Math.abs(side)) * 0.8).toFixed(1);
    else delta = +(-magnitude * (0.4 + Math.abs(side)) * Math.abs(dir) * 0.7).toFixed(1);
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [start, end] },
      properties: {
        delta,
        absDelta: Math.abs(delta),
        label: `${delta > 0 ? "+" : ""}${delta}%`,
      },
    });
  });
  return { type: "FeatureCollection", features };
}

// Emergency-route corridors: straight lines from focal point to nearest of each service.
export function buildEmergencyCorridorFC(point: Point | null): FeatureCollection {
  if (!point) return { type: "FeatureCollection", features: [] };
  const list: Array<[string, typeof HOSPITALS]> = [
    ["Hospital", HOSPITALS], ["Fire", FIRE_STATIONS], ["Police", POLICE_STATIONS],
  ];
  const features: Feature[] = [];
  for (const [svc, src] of list) {
    const n = nearest(point, src);
    if (!n) continue;
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[point.lng, point.lat], [n.item.lng, n.item.lat]] },
      properties: { service: svc, name: n.item.name, km: +n.km.toFixed(2) },
    });
  }
  return { type: "FeatureCollection", features };
}
