import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Road = Tables["roads"]["Row"];
export type Simulation = Tables["simulations"]["Row"];
export type RiskZone = Tables["risk_zones"]["Row"];
export type Report = Tables["reports"]["Row"];

// Auto-generated CRUD wrappers. Supabase + RLS provide the actual REST APIs;
// these are thin typed helpers used by hooks/components.
function makeCrud<Row, Insert, Update>(table: string) {
  return {
    async list(): Promise<Row[]> {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    async get(id: string): Promise<Row | null> {
      const { data, error } = await (supabase as any).from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Row | null;
    },
    async create(payload: Insert): Promise<Row> {
      const { data, error } = await (supabase as any).from(table).insert(payload).select().single();
      if (error) throw error;
      return data as Row;
    },
    async update(id: string, patch: Update): Promise<Row> {
      const { data, error } = await (supabase as any).from(table).update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Row;
    },
    async remove(id: string): Promise<void> {
      const { error } = await (supabase as any).from(table).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export const roadsApi = makeCrud<Road, Tables["roads"]["Insert"], Tables["roads"]["Update"]>("roads");
export const simulationsApi = makeCrud<Simulation, Tables["simulations"]["Insert"], Tables["simulations"]["Update"]>("simulations");
export const riskZonesApi = makeCrud<RiskZone, Tables["risk_zones"]["Insert"], Tables["risk_zones"]["Update"]>("risk_zones");
export const reportsApi = makeCrud<Report, Tables["reports"]["Insert"], Tables["reports"]["Update"]>("reports");

export async function createSimulation(input: {
  action: string;
  road_id?: string | null;
  result_json: Record<string, unknown>;
}) {
  const { data: userData } = await supabase.auth.getUser();
  return simulationsApi.create({
    action: input.action,
    road_id: input.road_id ?? null,
    result_json: input.result_json as any,
    created_by: userData.user?.id ?? null,
  });
}

export async function createReport(input: { simulation_id?: string | null; report_text: string }) {
  const { data: userData } = await supabase.auth.getUser();
  return reportsApi.create({
    simulation_id: input.simulation_id ?? null,
    report_text: input.report_text,
    created_by: userData.user?.id ?? null,
  });
}
