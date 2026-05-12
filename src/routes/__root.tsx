import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import appCss from "../styles.css?url";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ensureSeed } from "@/lib/api/clawbench";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, FlaskConical } from "lucide-react";
import { useMockMode } from "@/lib/clawbench/mock-mode";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ClawBench — Agent eval control plane" },
      { name: "description", content: "Benchmark OpenClaw agent tasks across Nebius Token Factory models." },
      { property: "og:title", content: "ClawBench — Agent eval control plane" },
      { name: "twitter:title", content: "ClawBench — Agent eval control plane" },
      { property: "og:description", content: "Benchmark OpenClaw agent tasks across Nebius Token Factory models." },
      { name: "twitter:description", content: "Benchmark OpenClaw agent tasks across Nebius Token Factory models." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d7918839-9e60-47f7-ad62-217618ae6ce7/id-preview-ada9ca7a--e9ff9bf0-f0bb-4c7f-b40f-9bfc70054ee6.lovable.app-1778467654650.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d7918839-9e60-47f7-ad62-217618ae6ce7/id-preview-ada9ca7a--e9ff9bf0-f0bb-4c7f-b40f-9bfc70054ee6.lovable.app-1778467654650.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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

function SeedRunner() {
  useEffect(() => {
    ensureSeed().catch((e) => console.error("seed failed", e));
  }, []);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  const pathname = router.state.location.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isLandingRoute = pathname === "/";
  const isPublicRoute = isAuthRoute || isLandingRoute;

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoaded(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded && !session && !isPublicRoute) {
      navigate({ to: "/auth" });
    }
  }, [loaded, session, isPublicRoute, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      {isPublicRoute ? (
        <Outlet />
      ) : !loaded || !session ? (
        <div className="flex min-h-screen items-center justify-center bg-background" />
      ) : (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background text-foreground">
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
                <SidebarTrigger />
                <div className="flex items-center gap-2 text-sm font-medium">
                  ClawBench
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">Eval control plane</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <MockModeToggle />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{session.user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate({ to: "/auth" });
                    }}
                    className="gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </Button>
                </div>
              </header>
              <main className="flex-1">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
          <SeedRunner />
        </SidebarProvider>
      )}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
