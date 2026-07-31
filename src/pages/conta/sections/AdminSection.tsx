/**
 * Sprint UX · Área do Usuário — seção Administração.
 *
 * Isolada. Só renderiza para administradores (server-trusted via `useIsAdmin`).
 * Nunca mistura com opções do usuário comum.
 */
import { Link, Navigate } from "react-router-dom";
import { EditorialHero } from "@/components/editorial/harmony/EditorialHero";
import { EditorialCard } from "@/components/editorial/harmony/EditorialCard";
import { Button } from "@/components/ui/button";
import {
  Target, ClipboardList, Network, Library, Sparkles, GraduationCap, Compass, Users, ShieldCheck, ArrowRight, Activity,
} from "lucide-react";

import { useIsAdmin } from "@/hooks/useIsAdmin";

const groups = [
  {
    label: "Editorial", items: [
      { icon: Target,         title: "Mission Control",  description: "Batimento cardíaco: ICE global, módulos plugados.", href: "/admin/mission-control" },
      { icon: ClipboardList,  title: "Editorial Audit",  description: "Auditoria de qualidade, gate e certificação.",       href: "/admin/editorial-audit" },
      { icon: Network,        title: "Nexus Audit",      description: "Monitoramento do grafo teológico.",                  href: "/admin/nexus-audit" },
    ],
  },
  {
    label: "Conteúdo", items: [
      { icon: Library,        title: "Glossário",        description: "Verbetes, permissões e publicação.",                 href: "/admin/glossario" },
      { icon: Sparkles,       title: "Coleções",         description: "Curadoria e ordenação editorial.",                   href: "/admin/collections" },
      { icon: GraduationCap,  title: "Santos",           description: "Reimportação e curadoria hagiográfica.",             href: "/admin/saints" },
      { icon: Compass,        title: "Jornadas",         description: "Programas de formação estruturada.",                 href: "/admin/jornadas" },
    ],
  },
  {
    label: "Sistema", items: [
      { icon: Activity,       title: "Site Health",      description: "Saúde da plataforma, atividade e auditoria.",        href: "/admin/site-health" },
      { icon: Users,          title: "Usuários",         description: "Papéis, permissões e vínculos.",                     href: "/admin/users" },
      { icon: ShieldCheck,    title: "Segurança e SEO",  description: "Diagnóstico, telemetria, alertas.",                  href: "/admin" },

    ],
  },
];

export default function AdminSection() {
  const { isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Verificando permissões…</div>;
  if (!isAdmin) return <Navigate to="/conta/perfil" replace />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <EditorialHero>
        <EditorialHero.Eyebrow>Administração</EditorialHero.Eyebrow>
        <EditorialHero.Title>Painéis administrativos</EditorialHero.Title>
        <EditorialHero.Subtitle>
          Área isolada. As opções abaixo alteram conteúdo público e configurações do sistema.
        </EditorialHero.Subtitle>
      </EditorialHero>

      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.label}>
            <h2 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{g.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.items.map((it) => (
                <EditorialCard key={it.href} density="balanced">
                  <EditorialCard.Title>
                    <div className="flex items-center gap-2">
                      <it.icon className="h-4 w-4 text-primary" /> {it.title}
                    </div>
                  </EditorialCard.Title>
                  <EditorialCard.Description>{it.description}</EditorialCard.Description>
                  <EditorialCard.CTA>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={it.href}>Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                    </Button>
                  </EditorialCard.CTA>
                </EditorialCard>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
