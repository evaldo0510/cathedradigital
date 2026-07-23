/**
 * Sprint UX · Área do Usuário — seção Minha Jornada.
 *
 * Agrega ponteiros para: Leituras, Orações, Coleções, Jornadas e Progresso.
 * Usa EditorialHero + EditorialCard. Sem lógica nova de domínio: apenas
 * cross-links + contadores do hook `useAccountCounters`.
 */
import { Link } from "react-router-dom";
import { EditorialHero } from "@/components/editorial/harmony/EditorialHero";
import { EditorialCard } from "@/components/editorial/harmony/EditorialCard";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Library, Compass, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { useAccountCounters } from "@/hooks/useAccountCounters";
import { useAuth } from "@/hooks/useAuth";
import { getLevelInfo } from "@/lib/levels";

interface Tile {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  countLabel?: string;
}

export default function JornadaSection() {
  const { profile } = useAuth();
  const { data: c } = useAccountCounters();
  const xp = profile?.xp ?? 0;
  const level = getLevelInfo(xp);

  const tiles: Tile[] = [
    { eyebrow: "Escritura",  title: "Leituras",  description: "Marcações e reflexões na Bíblia.",       href: "/biblia",     icon: BookOpen, count: c?.readingsMarks, countLabel: "marcações" },
    { eyebrow: "Igreja",     title: "Orações",   description: "Sessões e progresso litúrgico.",         href: "/oracao",     icon: Heart,    count: c?.prayerSessions, countLabel: "sessões" },
    { eyebrow: "Curadoria",  title: "Coleções",  description: "Percursos temáticos em andamento.",      href: "/colecoes",   icon: Library,  count: c?.collections, countLabel: "em andamento" },
    { eyebrow: "Formação",   title: "Jornadas",  description: "Programas de aprofundamento.",           href: "/jornadas",   icon: Compass,  count: c?.journeys, countLabel: "ativas" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <EditorialHero>
        <EditorialHero.Eyebrow>Minha Jornada</EditorialHero.Eyebrow>
        <EditorialHero.Title>Continue por onde parou</EditorialHero.Title>
        <EditorialHero.Subtitle>
          Um panorama unificado do seu caminho pela plataforma: Escritura, Igreja, Curadoria e Formação.
        </EditorialHero.Subtitle>
      </EditorialHero>

      {/* Faixa de progresso espiritual + última atividade */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Progresso espiritual
          </div>
          <p className="mt-2 font-serif text-2xl leading-none">{level.levelName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {xp} XP · {level.nextLevel ? `próximo: ${level.nextLevel.name}` : "nível máximo alcançado"}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(level.progress * 100)}%` }} />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Última atividade
          </div>
          <p className="mt-2 text-sm">
            Você tem <span className="font-semibold">{c?.journalEntries ?? 0}</span> entradas no diário e{" "}
            <span className="font-semibold">{c?.notes ?? 0}</span> notas pessoais.
          </p>
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to="/conta/diario">Abrir diário <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tiles das áreas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <EditorialCard key={t.href} density="balanced">
            <EditorialCard.Eyebrow>{t.eyebrow}</EditorialCard.Eyebrow>
            <EditorialCard.Title>
              <div className="flex items-center gap-2">
                <t.icon className="h-4 w-4 text-muted-foreground" /> {t.title}
                {typeof t.count === "number" && t.count > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
                    {t.count} {t.countLabel}
                  </span>
                )}
              </div>
            </EditorialCard.Title>
            <EditorialCard.Description>{t.description}</EditorialCard.Description>
            <EditorialCard.CTA>
              <Button asChild variant="ghost" size="sm">
                <Link to={t.href}>Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </EditorialCard.CTA>
          </EditorialCard>
        ))}
      </div>
    </div>
  );
}
