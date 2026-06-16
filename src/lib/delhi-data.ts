// Curated real Delhi NCR landmarks, infrastructure, and risk zones.
// Coordinates are approximate from publicly available OpenStreetMap / Wikipedia data.
// Used by the map for POI overlays and by the AI Planner for location lookup.

export const DELHI_CENTER: [number, number] = [77.209, 28.6139]; // Connaught Place
export const DELHI_ZOOM = 11;

export type Poi = {
  name: string;
  lng: number;
  lat: number;
  kind: "metro" | "hospital" | "school" | "govt" | "landmark";
  aliases?: string[];
};

// Real Delhi Metro stations (sample of major interchanges + termini)
export const METRO_STATIONS: Poi[] = [
  { name: "Rajiv Chowk", lng: 77.2190, lat: 28.6328, kind: "metro", aliases: ["connaught place", "cp"] },
  { name: "Kashmere Gate", lng: 77.2280, lat: 28.6675, kind: "metro" },
  { name: "Central Secretariat", lng: 77.2125, lat: 28.6149, kind: "metro" },
  { name: "New Delhi", lng: 77.2226, lat: 28.6427, kind: "metro" },
  { name: "Hauz Khas", lng: 77.2065, lat: 28.5440, kind: "metro" },
  { name: "Saket", lng: 77.2206, lat: 28.5208, kind: "metro" },
  { name: "Chhatarpur", lng: 77.1755, lat: 28.5067, kind: "metro" },
  { name: "Dwarka Sector 21", lng: 77.0566, lat: 28.5523, kind: "metro" },
  { name: "Noida City Centre", lng: 77.3560, lat: 28.5747, kind: "metro" },
  { name: "Botanical Garden", lng: 77.3344, lat: 28.5644, kind: "metro" },
  { name: "HUDA City Centre", lng: 77.0726, lat: 28.4595, kind: "metro" },
  { name: "Mandi House", lng: 77.2342, lat: 28.6256, kind: "metro" },
  { name: "ITO", lng: 77.2410, lat: 28.6304, kind: "metro" },
  { name: "Lajpat Nagar", lng: 77.2363, lat: 28.5705, kind: "metro" },
  { name: "Laxmi Nagar", lng: 77.2773, lat: 28.6362, kind: "metro" },
  { name: "Anand Vihar", lng: 77.3151, lat: 28.6470, kind: "metro" },
  { name: "Karol Bagh", lng: 77.1903, lat: 28.6516, kind: "metro" },
  { name: "Rajouri Garden", lng: 77.1209, lat: 28.6491, kind: "metro" },
  { name: "Janakpuri West", lng: 77.0875, lat: 28.6293, kind: "metro" },
  { name: "Vaishali", lng: 77.3399, lat: 28.6464, kind: "metro" },
];

export const HOSPITALS: Poi[] = [
  { name: "AIIMS Delhi", lng: 77.2074, lat: 28.5672, kind: "hospital", aliases: ["aiims"] },
  { name: "Safdarjung Hospital", lng: 77.2052, lat: 28.5687, kind: "hospital" },
  { name: "Ram Manohar Lohia Hospital", lng: 77.2055, lat: 28.6256, kind: "hospital", aliases: ["rml"] },
  { name: "Lok Nayak Hospital", lng: 77.2410, lat: 28.6396, kind: "hospital" },
  { name: "GTB Hospital", lng: 77.3119, lat: 28.6862, kind: "hospital" },
  { name: "Apollo Hospital Sarita Vihar", lng: 77.2860, lat: 28.5333, kind: "hospital" },
  { name: "Max Saket", lng: 77.2202, lat: 28.5283, kind: "hospital" },
  { name: "Fortis Shalimar Bagh", lng: 77.1647, lat: 28.7163, kind: "hospital" },
  { name: "Sir Ganga Ram Hospital", lng: 77.1894, lat: 28.6438, kind: "hospital" },
];

export const SCHOOLS: Poi[] = [
  { name: "Delhi Public School R. K. Puram", lng: 77.1736, lat: 28.5615, kind: "school", aliases: ["dps rk puram"] },
  { name: "Modern School Barakhamba", lng: 77.2284, lat: 28.6280, kind: "school" },
  { name: "Sardar Patel Vidyalaya", lng: 77.2074, lat: 28.5959, kind: "school" },
  { name: "Springdales Pusa Road", lng: 77.1843, lat: 28.6431, kind: "school" },
  { name: "St. Columba's School", lng: 77.2160, lat: 28.6396, kind: "school" },
  { name: "Sanskriti School", lng: 77.1755, lat: 28.5891, kind: "school" },
  { name: "Mount Carmel School Anand Niketan", lng: 77.1810, lat: 28.5790, kind: "school" },
];

export const GOVT_BUILDINGS: Poi[] = [
  { name: "Rashtrapati Bhavan", lng: 77.1990, lat: 28.6143, kind: "govt" },
  { name: "Parliament House", lng: 77.2080, lat: 28.6172, kind: "govt", aliases: ["sansad bhavan"] },
  { name: "North Block (Secretariat)", lng: 77.2089, lat: 28.6160, kind: "govt" },
  { name: "South Block (Secretariat)", lng: 77.2076, lat: 28.6135, kind: "govt" },
  { name: "Delhi Secretariat", lng: 77.2410, lat: 28.6315, kind: "govt" },
  { name: "Supreme Court of India", lng: 77.2398, lat: 28.6224, kind: "govt" },
  { name: "Delhi High Court", lng: 77.2440, lat: 28.6092, kind: "govt" },
];

export const LANDMARKS: Poi[] = [
  { name: "India Gate", lng: 77.2295, lat: 28.6129, kind: "landmark" },
  { name: "Red Fort", lng: 77.2410, lat: 28.6562, kind: "landmark", aliases: ["lal qila"] },
  { name: "Qutub Minar", lng: 77.1855, lat: 28.5245, kind: "landmark" },
  { name: "Humayun's Tomb", lng: 77.2507, lat: 28.5933, kind: "landmark" },
  { name: "Lotus Temple", lng: 77.2588, lat: 28.5535, kind: "landmark" },
  { name: "Akshardham", lng: 77.2773, lat: 28.6127, kind: "landmark" },
  { name: "Jama Masjid", lng: 77.2334, lat: 28.6507, kind: "landmark" },
  { name: "Chandni Chowk", lng: 77.2305, lat: 28.6562, kind: "landmark" },
  { name: "Connaught Place", lng: 77.2167, lat: 28.6315, kind: "landmark", aliases: ["cp", "rajiv chowk"] },
  { name: "Karol Bagh Market", lng: 77.1903, lat: 28.6516, kind: "landmark" },
  { name: "Nehru Place", lng: 77.2519, lat: 28.5494, kind: "landmark" },
  { name: "Saket District Centre", lng: 77.2206, lat: 28.5244, kind: "landmark" },
  { name: "Dilli Haat INA", lng: 77.2095, lat: 28.5739, kind: "landmark" },
  { name: "Cyber Hub Gurugram", lng: 77.0883, lat: 28.4949, kind: "landmark" },
];

export const ALL_POIS: Poi[] = [
  ...METRO_STATIONS,
  ...HOSPITALS,
  ...SCHOOLS,
  ...GOVT_BUILDINGS,
  ...LANDMARKS,
];

// Flood-prone zones along the Yamuna river — recurring flood areas per
// Delhi Govt Irrigation & Flood Control Dept. advisories.
export const FLOOD_ZONES: Array<{ name: string; lng: number; lat: number; radius: number; risk: "high" | "med" | "low" }> = [
  { name: "Yamuna Bazar / Old Iron Bridge", lng: 77.2410, lat: 28.6630, radius: 0.018, risk: "high" },
  { name: "Mayur Vihar Phase I khadar", lng: 77.2920, lat: 28.6090, radius: 0.020, risk: "high" },
  { name: "Geeta Colony / ITO floodplain", lng: 77.2510, lat: 28.6420, radius: 0.016, risk: "high" },
  { name: "Yamuna Khadar Usmanpur", lng: 77.2710, lat: 28.6790, radius: 0.022, risk: "high" },
  { name: "Okhla Barrage floodplain", lng: 77.3070, lat: 28.5380, radius: 0.020, risk: "med" },
  { name: "Najafgarh Drain basin", lng: 77.0570, lat: 28.6090, radius: 0.030, risk: "med" },
  { name: "Wazirabad", lng: 77.2380, lat: 28.7180, radius: 0.018, risk: "med" },
  { name: "Burari low-lying", lng: 77.2010, lat: 28.7460, radius: 0.020, risk: "med" },
];

// Infrastructure stress hotspots (anecdotal — water/power/transport pressure points)
export const STRESS_ZONES = [
  { name: "Bhalswa Landfill area", lng: 77.1620, lat: 28.7430, score: 0.94, risk: "danger" },
  { name: "Ghazipur Landfill / drainage", lng: 77.3260, lat: 28.6240, score: 0.92, risk: "danger" },
  { name: "Old Delhi water network", lng: 77.2330, lat: 28.6560, score: 0.81, risk: "warn" },
  { name: "Sangam Vihar (unauth. colony water)", lng: 77.2380, lat: 28.5060, score: 0.78, risk: "warn" },
  { name: "Narela industrial grid", lng: 77.0890, lat: 28.8530, score: 0.71, risk: "warn" },
];

// Traffic growth corridors
export const GROWTH_CORRIDORS = [
  { name: "NH-48 Delhi–Gurugram Expressway", score: "+38%", risk: "danger" },
  { name: "DND Flyway (Mayur Vihar–Noida)", score: "+29%", risk: "danger" },
  { name: "Outer Ring Road (Wazirabad–AIIMS)", score: "+24%", risk: "warn" },
  { name: "NH-9 Delhi–Meerut Expressway", score: "+22%", risk: "warn" },
  { name: "Mathura Road (Ashram–Badarpur)", score: "+18%", risk: "warn" },
  { name: "Rohtak Road / NH-9", score: "+9%", risk: "safe" },
];

// Resolve a free-text query to the best matching Delhi POI/zone.
export function resolveDelhiLocation(query: string): { name: string; lng: number; lat: number } | null {
  const q = query.toLowerCase();
  const candidates: Array<{ name: string; lng: number; lat: number; aliases?: string[] }> = [
    ...ALL_POIS,
    ...FLOOD_ZONES.map((z) => ({ name: z.name, lng: z.lng, lat: z.lat })),
    ...STRESS_ZONES.map((z) => ({ name: z.name, lng: z.lng, lat: z.lat })),
  ];
  for (const c of candidates) {
    const names = [c.name.toLowerCase(), ...(c.aliases ?? [])];
    if (names.some((n) => q.includes(n))) return { name: c.name, lng: c.lng, lat: c.lat };
  }
  // Token overlap fallback
  const tokens = q.split(/\W+/).filter((t) => t.length > 3);
  let best: { score: number; c: typeof candidates[number] | null } = { score: 0, c: null };
  for (const c of candidates) {
    const name = c.name.toLowerCase();
    const score = tokens.reduce((s, t) => (name.includes(t) ? s + 1 : s), 0);
    if (score > best.score) best = { score, c };
  }
  return best.c ? { name: best.c.name, lng: best.c.lng, lat: best.c.lat } : null;
}

// Cross-component "fly to" bus — AI Planner uses this to drive the map.
export type FlyToDetail = { lng: number; lat: number; zoom?: number; label?: string };
export function emitFlyTo(detail: FlyToDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<FlyToDetail>("uv:flyTo", { detail }));
}
