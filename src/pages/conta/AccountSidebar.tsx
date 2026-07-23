/**
 * Sprint UX · Área do Usuário — sidebar de conta.
 *
 * 5 grupos do usuário + 1 grupo admin condicional (server-trusted via useIsAdmin).
 * Cada grupo: ícone Lucide + título + descrição + contador (opcional).
 * Nunca mistura opções admin com opções do usuário comum.
 */
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle, Compass, BookmarkCheck, NotebookPen, Settings2, ShieldCheck,
  Target, ClipboardList, Users, Library, Sparkles, Network, GraduationCap,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAccountCounters } from "@/hooks/useAccountCounters";

type Item = {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
};

export function AccountSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { isAdmin } = useIsAdmin();
  const { data: c } = useAccountCounters();

  const userItems: Item[] = [
    { title: "Perfil",         description: "Identidade, plano e estatísticas",     url: "/conta/perfil",         icon: UserCircle },
    { title: "Minha Jornada",  description: "Leituras, orações, coleções, jornadas", url: "/conta/jornada",        icon: Compass,
      count: (c?.readingsMarks ?? 0) + (c?.prayerSessions ?? 0) + (c?.collections ?? 0) + (c?.journeys ?? 0) },
    { title: "Favoritos",      description: "Bíblia, Catecismo, Glossário, Santos", url: "/conta/favoritos",      icon: BookmarkCheck, count: c?.favorites ?? 0 },
    { title: "Diário",         description: "Entradas espirituais e reflexões",     url: "/conta/diario",         icon: NotebookPen,   count: c?.journalEntries ?? 0 },
    { title: "Configurações",  description: "Aparência, áudio, notificações",       url: "/conta/configuracoes",  icon: Settings2 },
  ];

  const adminItems: Item[] = [
    { title: "Mission Control",   description: "Batimento cardíaco da plataforma", url: "/admin/mission-control",     icon: Target },
    { title: "Editorial Audit",   description: "ICE, gate, freeze",                 url: "/admin/editorial-audit",     icon: ClipboardList },
    { title: "Nexus Audit",       description: "Grafo teológico",                   url: "/admin/nexus-audit",         icon: Network },
    { title: "Glossário",         description: "Verbetes e curadoria",              url: "/admin/glossario",           icon: Library },
    { title: "Coleções",          description: "Curadoria editorial",               url: "/admin/collections",         icon: Sparkles },
    { title: "Santos",            description: "Reimportação e curadoria",          url: "/admin/saints",              icon: GraduationCap },
    { title: "Jornadas",          description: "Formação estruturada",              url: "/admin/jornadas",            icon: Compass },
    { title: "Usuários",          description: "Papéis e permissões",               url: "/admin/users",               icon: Users },
    { title: "Sistema",           description: "Segurança, SEO, telemetria",        url: "/admin",                     icon: ShieldCheck },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Minha Conta</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-start gap-3 py-2">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium leading-none">{item.title}</span>
                            {typeof item.count === "number" && item.count > 0 && (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] tabular-nums">
                                {item.count > 999 ? "999+" : item.count}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="flex items-center gap-1.5 text-amber-700">
                <ShieldCheck className="h-3 w-3" /> Administração
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <NavLink to={item.url} className="flex items-start gap-3 py-2">
                        <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium leading-none">{item.title}</span>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{item.description}</p>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
