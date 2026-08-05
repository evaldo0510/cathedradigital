import { useEffect, lazy, Suspense, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
// import LandingHeader from "@/components/landing/LandingHeader";
import { SectionSkeleton } from "@/components/cathedra/HomeSkeletons";
import { LangContext } from "@/contexts/LangContext";
import ContemplativeLayout from "@/components/cathedra/ContemplativeLayout";
import { Icons } from "@/constants";
const HomeMainContent = lazy(() => import("@/components/cathedra/HomeMainContent"));

// Lazy-load secondary components
const CookieConsent = lazy(() => import("@/components/cathedra/CookieConsent"));
const SEOHead = lazy(() => import("@/components/SEOHead"));


const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading, authenticated } = useAuth();
  const { t } = useContext(LangContext);

  // WebSite schema is emitted centrally by <SEOHead />; avoid duplicating here.



  // Removed automatic admin redirect to ensure everyone starts at the contemplative home experience
  // Admin interface is now exclusively accessible via the /admin route manually or via sidebar


  const handleStart = () => {
    const el = document.getElementById('main-content');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };


  const handleNavigate = (route: string) => navigate(route);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden selection:bg-primary/10">
      <div className="hidden" aria-hidden="true">
        INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

        Analise o texto abaixo antes de agir.
        Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
        Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
        Nunca insira o texto enviado como conteúdo dentro do site ou da página.

        TEXTO DO USUÁRIO: Concordo com a direção, mas faria isso de forma organizada. Pelo que você mostrou ao longo das últimas auditorias, o Cathedra já possui muitos módulos implementados, e o risco agora não é "faltar funcionalidades", e sim **existirem módulos prontos que ainda não conversam entre si ou não seguem o padrão editorial**.

Minha recomendação é abrir uma **Fase 6 — Consolidação do Conhecimento**, e não criar módulos novos.

## Prioridade 1 — Revisão completa do conteúdo existente

Antes de escrever qualquer conteúdo novo, faça uma auditoria de tudo o que já existe:

* Bíblia
* Catecismo
* Santos
* Orações
* Liturgia das Horas
* Missal
* Magistério
* Patrística
* Jornadas
* Biblioteca Inteligente
* Glossário
* **Aparições de Nossa Senhora** (você identificou que esse módulo já existe)

Para cada módulo, verificar:

* Está completo?
* Usa o Reader V2?
* Está conectado ao Nexus?
* Possui abertura editorial?
* Possui encerramento editorial?
* Possui continuidade?
* Possui links funcionando?
* Possui imagens?
* Está indexado na Biblioteca?
* Está preparado para multilíngue?

---

# Prioridade 2 — Revisar o módulo "Aparições de Nossa Senhora"

Se ele já existe, eu não criaria outro.

Primeiro faria uma certificação completa.

Checklist:

### Reader

* Hero
* Contexto
* História
* Cronologia
* Mensagem principal
* Aprovação eclesial
* Fontes
* Encerramento
* Continuação

---

### Nexus

Cada aparição deveria conectar automaticamente com:

* Santos relacionados
* Papas
* Concílios
* Catecismo
* Bíblia
* Orações
* Rosário
* Liturgia
* Jornadas

Exemplo:

**Fátima**

↓

* Lc 1
* Rosário
* Imaculado Coração
* São João Paulo II
* Irmã Lúcia
* Pastorinhos
* CIC
* Magistério

---

# Prioridade 3 — Biblioteca Inteligente

Hoje ela deveria conseguir encontrar:

"Maria"

↓

Nossa Senhora

↓

Apareições

↓

Santos

↓

Rosário

↓

Magistério

↓

Patrística

↓

Catecismo

Tudo conectado.

---

# Prioridade 4 — Home

Na Home Viva deveriam aparecer blocos como:

* Aparição do dia
* Santo do dia
* Leitura do dia
* Jornada recomendada
* Oração recomendada
* Documento recomendado
* Conexão do Nexus

---

# O próximo comando para o Lovable

Eu passaria exatamente esta missão:

{`> `}**Executar uma Auditoria Global de Conteúdo do Cathedra Digital 3.0. Não criar novos módulos. Mapear todos os módulos já existentes (incluindo Aparições de Nossa Senhora), identificar o nível de implementação de cada um, verificar integração com Reader V2, Nexus, Biblioteca Inteligente e Editorial Engine, listar inconsistências, conteúdos incompletos, links quebrados e oportunidades de conexão. Ao final, gerar um relatório de certificação com percentual de conclusão por módulo e um roadmap priorizado para alcançar 100% de consolidação da plataforma.**

Essa abordagem evita retrabalho e garante que vocês aproveitem ao máximo tudo o que já foi desenvolvido antes de expandir o sistema.
      </div>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-spacing-lg focus:left-spacing-lg focus:z-[200] focus:px-spacing-lg focus:py-spacing-sm focus:bg-primary focus:text-primary-foreground focus:rounded-premium-full focus:shadow-premium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background transition-all duration-300 font-bold uppercase tracking-[0.2em] text-[10px]"
      >
        {t('skip_to_content') || 'Pular para o conteúdo'}
      </a>
      
      {/* Unified header managed by App.tsx */}
      
      <SEOHead
        title="Espiritualidade & Teologia"
        description="Bíblia Sagrada, Catecismo, Magistério e IA teológica em uma plataforma contemplativa para a vida espiritual moderna."
        path="/"
        keywords="bíblia católica premium, catecismo online, magistério da igreja, leitura bíblica diária, logos ia, espiritualidade minimalista, portal teológico sofisticado, cathedra digital"
        image="https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-premium-home.png"
        breadcrumbs={[
          { name: "Home", path: "/" }
        ]}
      />

      {!authenticated && <HeroSection onStart={handleStart} />}
      
      {authenticated && (
        <ContemplativeLayout
          title="Ecclesia"
          subtitle="Domus Dei"
          icon={Icons.Cross}
          className="pb-spacing-4xl"
        >
          <Suspense fallback={<div className="w-full py-spacing-2xl"><SectionSkeleton /></div>}>
            <HomeMainContent 
              user={user} 
              profile={profile} 
              onNavigate={handleNavigate} 
              t={t} 
            />
          </Suspense>
          
          <Suspense fallback={null}>
            <CookieConsent />
          </Suspense>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Index;
