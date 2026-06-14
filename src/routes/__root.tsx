import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/app-sidebar";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-mono text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sector not mapped</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This coordinate isn't in the UrbanVerse tileset.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">System fault detected</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A subsystem returned an unexpected state. Telemetry has been logged.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UrbanVerse — City Operations Platform" },
      { name: "description", content: "Real-time simulation, vulnerability assessment, and AI-assisted planning for modern cities." },
      { property: "og:title", content: "UrbanVerse — City Operations Platform" },
      { property: "og:description", content: "Real-time simulation, vulnerability assessment, and AI-assisted planning for modern cities." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function TopBar() {
  return (
    <header className="h-14 border-b border-border bg-panel flex items-center px-5 gap-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          New York Metropolitan · District 04
        </div>
        <div className="text-sm font-medium">Operations Console</div>
      </div>
      <div className="flex-1" />
      <div className="hidden md:flex items-center gap-5 text-mono text-[11px] text-muted-foreground">
        <span><span className="text-foreground">14,832</span> sensors</span>
        <span><span className="text-foreground">8.4M</span> residents</span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-safe shadow-[0_0_8px] shadow-safe" />
          <span className="text-foreground">All systems nominal</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right leading-tight">
          <div className="text-xs font-medium">Dr. Elena Vasquez</div>
          <div className="text-[10px] text-muted-foreground">Chief Planner · Tier 5</div>
        </div>
        <div className="size-8 rounded-full bg-gradient-to-br from-primary/40 to-accent border border-border grid place-items-center text-xs font-medium">
          EV
        </div>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname === "/auth";

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthRoute ? (
        <Outlet />
      ) : (
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 overflow-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      )}
      <Toaster theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}
