import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

// Generic CRUD factory — auto-generated CRUD API for each table.
function crud<T extends keyof Tables>(table: T) {
  type Row = Tables[T]["Row"];
  type Insert = Tables[T]["Insert"];
  type Update = Tables[T]["Update"];

  return {
    async list(): Promise<Row[]> {
      const { data, error } = await supabase.from(table).select("*").order("created_at" as any, { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    async get(id: string): Promise<Row | null> {
      const { data, error } = await supabase.from(table).select("*").eq("id" as any, id).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },
    async create(payload: Insert): Promise<Row> {
      const { data, error } = await supabase.from(table).insert(payload as any).select().single();
      if (error) throw error;
      return data as Row;
    },
    async update(id: string, patch: Update): Promise<Row> {
      const { data, error } = await supabase.from(table).update(patch as any).eq("id" as any, id).select().single();
      if (error) throw error;
      return data as Row;
    },
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from(table).delete().eq("id" as any, id);
      if (error) throw error;
    },
  };
}

export const roadsApi = crud("roads");
export const simulationsApi = crud("simulations");
export const riskZonesApi = crud("risk_zones");
export const reportsApi = crud("reports");

// Convenience: insert with current user auto-attached to created_by.
export async function createSimulation(input: { action: string; road_id?: string | null; result_json: Record<string, unknown> }) {
  const { data: userData } = await supabase.auth.getUser();
  return simulationsApi.create({
    action: input.action,
    road_id: input.road_id ?? null,
    result_json: input.result_json,
    created_by: userData.user?.id ?? null,
  } as any);
}

export async function createReport(input: { simulation_id?: string | null; report_text: string }) {
  const { data: userData } = await supabase.auth.getUser();
  return reportsApi.create({
    simulation_id: input.simulation_id ?? null,
    report_text: input.report_text,
    created_by: userData.user?.id ?? null,
  } as any);
}
