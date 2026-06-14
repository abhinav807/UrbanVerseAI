import { createFileRoute } from "@tanstack/react-router";
import { PanelHeader } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — UrbanVerse" },
      { name: "description", content: "Workspace configuration, integrations, and data sources." },
    ],
  }),
  component: Settings,
});

function Settings() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 max-w-[1100px] mx-auto space-y-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        </div>

        <div className="panel-surface rounded-md">
          <PanelHeader subtitle="Organization" title="City Profile" />
          <div className="p-4 grid md:grid-cols-2 gap-4">
            <Field label="City"><Input defaultValue="New York Metropolitan" /></Field>
            <Field label="Region code"><Input defaultValue="NA-EAST-1" /></Field>
            <Field label="Operations center"><Input defaultValue="District 04 · Downtown" /></Field>
            <Field label="Timezone"><Input defaultValue="America/New_York (EDT)" /></Field>
          </div>
        </div>

        <div className="panel-surface rounded-md">
          <PanelHeader subtitle="Telemetry" title="Data Sources" />
          <div className="divide-y divide-border">
            {[
              { name: "Traffic Sensor Mesh · TSM-v4", desc: "14,832 endpoints · 1s polling", on: true },
              { name: "USGS Hydrology Feed", desc: "Real-time gauge data · 18 stations", on: true },
              { name: "Bridge & Tunnel Strain Sensors", desc: "412 strain gauges · 30s polling", on: true },
              { name: "Air Quality Network", desc: "AQI · 96 stations", on: false },
              { name: "MTA Transit Live", desc: "GTFS-RT vehicle feed", on: true },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3.5">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel-surface rounded-md">
          <PanelHeader subtitle="AI Planner" title="Model & Behavior" />
          <div className="p-4 space-y-4">
            <Field label="Active model">
              <Input defaultValue="urbanverse-planner-v2.4 (gov-tier)" />
            </Field>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto-generate recommendations</div>
                <div className="text-xs text-muted-foreground">
                  Surface AI suggestions on the dashboard daily at 08:00 local time.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Require human approval for scenarios</div>
                <div className="text-xs text-muted-foreground">
                  Block automatic execution of high-impact recommendations.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <div className="panel-surface rounded-md">
          <PanelHeader subtitle="Compliance" title="Access & Audit" />
          <div className="p-4 space-y-2 text-sm">
            <Row k="Compliance frameworks" v="SOC 2 Type II · FedRAMP Moderate · ISO 27001" />
            <Row k="Audit log retention" v="7 years" />
            <Row k="Encryption" v="AES-256 at rest · TLS 1.3 in transit" />
            <Row k="Last security review" v="2026-04-22 by external auditor" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pb-6">
          <Button variant="ghost">Discard</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/60">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{k}</span>
      <span className="text-mono text-xs">{v}</span>
    </div>
  );
}
