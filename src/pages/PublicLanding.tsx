import { lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Heart,
  GraduationCap,
  Search,
  Compass,
  Sparkles,
  Sun,
  Network,
  Crown,
  HandHeart,
  ArrowRight,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import { Button } from "@/components/ui/button";
import {
  EditorialShell,
  EditorialHero,
  EditorialSection,
  EditorialHeader,
  EditorialCard,
  EditorialGrid,
  EditorialDivider,
} from "@/components/editorial";

const SEOHead = lazy(() => import("@/components/SEOHead"));
import LandingFAQ, { LANDING_FAQS } from "@/components/landing/LandingFAQ";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

/* --------------------------------------------------------------------- */
/* Dados das seções                                                       */
/* --------------------------------------------------------------------- */

const AMBIENTES = [
  {
    kicker: "I · Studium",
    title: "Estudar",
    description: "Escritura, Catecismo e Magistério em um único acervo interligado.",
    icon: BookOpen,
    href: "/bible",
  },
  {
    kicker: "II · Oratio",
    title: "Rezar",
    description: "Liturgia, Lectio Divina e oração diária no ritmo da Igreja.",
    icon: Heart,
    href: "/oracao",
  },
  {
    kicker: "III · Formatio",
    title: "Formar-se",
    description: "Trilhas guiadas de formação doutrinal, espiritual e moral.",
    icon: GraduationCap,
    href: "/jornadas",
  },
  {
    kicker: "IV · Quaerere",
    title: "Pesquisar",
    description: "Busca semântica universal em toda a Tradição católica.",
    icon: Search,
    href: "/logos",
  },
  {
    kicker: "V · Iter Meum",
    title: "Minha Jornada",
    description: "Progresso, favoritos e notas do seu caminho contemplativo.",
    icon: Compass,
    href: "/conta",
  },
];

const DIFERENCIAIS = [
  {
    kicker: "Nexus Map",
    title: "Rede semântica viva",
    description:
      "Cada versículo, artigo do Catecismo e verbete do Glossário conversa com toda a Tradição.",
    icon: Network,
  },
  {
    kicker: "Editorial",
    title: "100% curadoria católica",
    description:
      "Conteúdo revisado sob o Índice de Confiança Editorial (ICE) — sem alucinação, sem heresia.",
    icon: Sparkles,
  },
  {
    kicker: "Ritmo litúrgico",
    title: "Calendário como coração",
    description:
      "Missal, Liturgia das Horas e Santo do dia alinhados automaticamente ao seu tempo.",
    icon: Sun,
  },
];

const PLANOS = [
  {
    kicker: "Peregrino",
    title: "Gratuito",
    description:
      "Acesso completo à Bíblia, Catecismo, Liturgia diária, Orações fundamentais e Logos AI (5 msgs/dia).",
    cta: "Começar agora",
    href: "/login",
    icon: HandHeart,
    accent: false,
  },
  {
    kicker: "Cathedra PRO",
    title: "Sustente o Sanctuarium",
    description:
      "Logos AI ilimitado, Rosário e Via Sacra Premium, Jornadas Ouro e 50% da mensalidade convertida em doação.",
    cta: "Conhecer PRO",
    href: "/pricing",
    icon: Crown,
    accent: true,
  },
];

/* --------------------------------------------------------------------- */
/* Página                                                                 */
/* --------------------------------------------------------------------- */

const PublicLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Suspense fallback={null}>
        <SEOHead
          title="Cathedra Digital — Sanctuarium Digital da Tradição Católica"
          description="Bíblia, Catecismo, Liturgia, Orações e Logos AI em uma biblioteca viva. Entrai no silêncio."
          path="/"
          faqs={LANDING_FAQS}
        />
      </Suspense>

      <LandingHeader />

      <section className="flex-1 pt-32 md:pt-40">
        <EditorialShell>
          {/* ---------------- Hero ---------------- */}
          <EditorialHero
            meta="Sanctuarium Digital · Est. MMXXVI"
            kicker="Cathedra Digital"
            title={
              <>
                Entrai no silêncio.
                <br />
                <em className="not-italic text-primary/85">Contemplai a Verdade.</em>
              </>
            }
            subtitle="A biblioteca viva da Tradição católica: Escritura, Catecismo, Liturgia, Orações e Magistério interligados por uma rede semântica editorial."
            parchment
            size="lg"
            action={
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="rounded-full px-8"
                >
                  Iniciar caminhada
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => navigate("/atrium")}
                  className="rounded-full px-6 text-primary/80 hover:text-primary"
                >
                  Explorar o Atrium
                </Button>
              </div>
            }
          />

          {/* ---------------- Cinco Ambientes ---------------- */}
          <EditorialSection id="ambientes">
            <div className="space-y-3 mb-8">
              <EditorialHeader kicker="Quinque Loca" title="Cinco ambientes, um só caminho" />
              <p className="max-w-2xl text-base text-muted-foreground">Uma arquitetura contemplativa inspirada na tradição monástica.</p>
            </div>
            <EditorialGrid cols={3}>
              {AMBIENTES.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.title} to={a.href} className="group">
                    <EditorialCard
                      kicker={a.kicker}
                      title={
                        <span className="flex items-center gap-3">
                          <Icon
                            className="h-5 w-5 text-secondary"
                            aria-hidden="true"
                          />
                          {a.title}
                        </span>
                      }
                      description={a.description}
                      meta={
                        <span className="inline-flex items-center gap-1 text-secondary group-hover:gap-2 transition-all">
                          Entrar <ArrowRight className="h-3 w-3" />
                        </span>
                      }
                    />
                  </Link>
                );
              })}
            </EditorialGrid>
          </EditorialSection>

          <EditorialDivider />

          {/* ---------------- Liturgia do dia ---------------- */}
          <EditorialSection id="liturgia">
            <div className="space-y-3 mb-8">
              <EditorialHeader kicker="Hodie · Hoje" title="Liturgia viva, todos os dias" />
              <p className="max-w-2xl text-base text-muted-foreground">Missal do dia, Liturgia das Horas e Santo — atualizados automaticamente.</p>
            </div>
            <EditorialGrid cols={2}>
              <Link to="/liturgia" className="group">
                <EditorialCard
                  variant="wide"
                  kicker="Liturgia Diária"
                  title="Missa do dia + Leituras"
                  description="Antífonas, leituras próprias e Evangelho com meditação e cross-references ao Catecismo."
                  meta={
                    <span className="inline-flex items-center gap-1 text-secondary">
                      Ver liturgia <ArrowRight className="h-3 w-3" />
                    </span>
                  }
                />
              </Link>
              <Link to="/oracao/liturgia-horas" className="group">
                <EditorialCard
                  variant="wide"
                  kicker="Liturgia das Horas"
                  title="Ofício Divino contínuo"
                  description="Laudes, Terça, Sexta, Vésperas e Completas com Próprio do dia integrado."
                  meta={
                    <span className="inline-flex items-center gap-1 text-secondary">
                      Rezar agora <ArrowRight className="h-3 w-3" />
                    </span>
                  }
                />
              </Link>
            </EditorialGrid>
          </EditorialSection>

          <EditorialDivider />

          {/* ---------------- Diferenciais ---------------- */}
          <EditorialSection id="nexus">
            <div className="space-y-3 mb-8">
              <EditorialHeader kicker="Symmetry of Truth" title="Uma inteligência a serviço da Tradição" />
              <p className="max-w-2xl text-base text-muted-foreground">O que torna Cathedra diferente de qualquer app católico.</p>
            </div>
            <EditorialGrid cols={3}>
              {DIFERENCIAIS.map((d) => {
                const Icon = d.icon;
                return (
                  <EditorialCard
                    key={d.title}
                    kicker={d.kicker}
                    title={
                      <span className="flex items-center gap-3">
                        <Icon
                          className="h-5 w-5 text-secondary"
                          aria-hidden="true"
                        />
                        {d.title}
                      </span>
                    }
                    description={d.description}
                  />
                );
              })}
            </EditorialGrid>
          </EditorialSection>

          <EditorialDivider />

          {/* ---------------- Planos ---------------- */}
          <EditorialSection id="planos">
            <div className="space-y-3 mb-8">
              <EditorialHeader kicker="Sustente o Sanctuarium" title="Um caminho gratuito. Uma vocação a apoiar." />
              <p className="max-w-2xl text-base text-muted-foreground">50% de cada assinatura PRO é convertida em doação a obras católicas.</p>
            </div>
            <EditorialGrid cols={2}>
              {PLANOS.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className={
                      p.accent
                        ? "rounded-3xl border border-secondary/50 bg-primary/[0.03] p-8 md:p-10 shadow-sm"
                        : "rounded-3xl border border-border/40 p-8 md:p-10"
                    }
                  >
                    <div className="flex items-center gap-3 text-secondary mb-6">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em]">
                        {p.kicker}
                      </span>
                    </div>
                    <h2 className="font-serif italic text-3xl md:text-4xl text-primary leading-tight mb-4">
                      {p.title}
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed mb-8">
                      {p.description}
                    </p>
                    <Button
                      onClick={() => navigate(p.href)}
                      size="lg"
                      variant={p.accent ? "default" : "outline"}
                      className={p.accent
                        ? "rounded-full px-6 bg-primary !text-primary-foreground hover:bg-primary/90"
                        : "rounded-full px-6"}
                    >
                      {p.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </EditorialGrid>
          </EditorialSection>

          <EditorialDivider />

          {/* ---------------- Depoimentos ---------------- */}
          <TestimonialsSection />

          <EditorialDivider />

          {/* ---------------- FAQ ---------------- */}
          <LandingFAQ />
        </EditorialShell>
      </section>

      {/* ---------------- Footer institucional ---------------- */}
      <footer className="mt-24 border-t border-border/40 bg-primary text-primary-foreground">
        <div className="app-container py-16 grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-display uppercase tracking-[0.4em] text-lg" style={{ color: 'var(--gold-on-dark)' }}>
              Cathedra Digital
            </h2>
            <p className="text-sm text-primary-foreground/70 max-w-md leading-relaxed">
              Sanctuarium Digital da Tradição Católica. Uma biblioteca viva
              para contemplar a Verdade através dos séculos.
            </p>
            <p className="text-xs text-primary-foreground/50">
              Ad maiorem Dei gloriam
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--gold-on-dark)' }}>

              Ambientes
            </h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/bible" className="inline-flex min-h-[44px] items-center hover:text-secondary">Bíblia</Link></li>
              <li><Link to="/catechism" className="inline-flex min-h-[44px] items-center hover:text-secondary">Catecismo</Link></li>
              <li><Link to="/liturgia" className="inline-flex min-h-[44px] items-center hover:text-secondary">Liturgia</Link></li>
              <li><Link to="/oracao" className="inline-flex min-h-[44px] items-center hover:text-secondary">Orações</Link></li>
              <li><Link to="/logos" className="inline-flex min-h-[44px] items-center hover:text-secondary">Logos AI</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--gold-on-dark)' }}>
              Cathedra
            </h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/atrium" className="inline-flex min-h-[44px] items-center hover:text-secondary">Atrium</Link></li>
              <li><Link to="/jornadas" className="inline-flex min-h-[44px] items-center hover:text-secondary">Jornadas</Link></li>
              <li><Link to="/glossario" className="inline-flex min-h-[44px] items-center hover:text-secondary">Glossário</Link></li>
              <li><Link to="/pricing" className="inline-flex min-h-[44px] items-center hover:text-secondary">Planos PRO</Link></li>
              <li><Link to="/login" className="inline-flex min-h-[44px] items-center hover:text-secondary">Entrar</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10">
          <div className="app-container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/60">
            <span>© {new Date().getFullYear()} Cathedra Digital · Todos os direitos reservados.</span>
            <span className="tracking-[0.2em] uppercase">Soli Deo Gloria</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
