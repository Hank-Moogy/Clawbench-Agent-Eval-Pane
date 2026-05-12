import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Activity,
  Database,
  Download,
  Gauge,
  History,
  PlayCircle,
  Route as RouteIcon,
  Settings,
  Trophy,
} from "lucide-react";

const items = [
  { title: "Run Eval", url: "/run", icon: PlayCircle },
  { title: "Eval History", url: "/history", icon: History },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Routing Rules", url: "/rules", icon: RouteIcon },
  { title: "Observability", url: "/observability", icon: Activity },
  { title: "Dataset Export", url: "/export", icon: Download },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/run" ? pathname === "/run" || pathname.startsWith("/eval") : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gauge className="h-4 w-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold tracking-tight">ClawBench</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent eval control plane</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.title}>
                    <Link to={it.url}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>OpenClaw • Nebius Token Factory</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
