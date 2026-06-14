import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FlaskConical,
  ShieldAlert,
  FileBarChart,
  Settings,
  Activity,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const items = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Simulator", to: "/simulator", icon: FlaskConical },
  { title: "Vulnerability", to: "/vulnerability", icon: ShieldAlert },
  { title: "Reports", to: "/reports", icon: FileBarChart },
  { title: "Settings", to: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-panel flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="size-7 rounded-sm bg-primary/15 border border-primary/40 grid place-items-center">
          <Activity className="size-4 text-primary" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">UrbanVerse</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
            City OS · v2.4
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <div className="px-2 pb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Operations
        </div>
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                active &&
                  "bg-accent/60 text-foreground border-l-2 border-primary pl-2 [padding-left:calc(0.625rem-2px)]",
              )}
            >
              <Icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>System Status</span>
          <span className="flex items-center gap-1.5 text-safe normal-case tracking-normal">
            <span className="size-1.5 rounded-full bg-safe shadow-[0_0_8px] shadow-safe" />
            Online
          </span>
        </div>
        <div className="text-mono text-[10px] text-muted-foreground space-y-0.5">
          <div className="flex justify-between"><span>Sensors</span><span>14,832</span></div>
          <div className="flex justify-between"><span>Uptime</span><span>99.982%</span></div>
          <div className="flex justify-between"><span>Region</span><span>NA-EAST-1</span></div>
        </div>
      </div>
    </aside>
  );
}
