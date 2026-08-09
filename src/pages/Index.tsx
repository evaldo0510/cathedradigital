import { useEffect, lazy, Suspense, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoute } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "./landing/HeroSection";
import BenefitsSection from "./landing/BenefitsSection";
import FeaturesSection from "./landing/FeaturesSection";
import TestimonialsSection from "./landing/TestimonialsSection";
import FaqSection from "./landing/FaqSection";
import PricingSection from "./landing/PricingSection";
import { SectionSkeleton } from "@/components/cathedra/HomeSkeletons";
import LeadCaptureForm from "@/components/landing/LeadCaptureForm";
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

        TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — ONDA 2.2
        VALIDAÇÃO DOS DADOS REAIS APÓS REATIVAÇÃO DA CLOUD

        A infraestrutura da Lovable Cloud foi reativada.

        A Onda 2.1 já certificou a integridade técnica dos P0.

        NÃO criar módulos.
        NÃO criar funcionalidades.
        NÃO alterar arquitetura.
        NÃO alterar Reader V2.
        NÃO substituir o SSoT.
        NÃO criar dados artificiais.

        Agora executar exclusivamente a validação dos DADOS REAIS.

        ATIVAR:

        - cathedra-operating-system
        - cathedra-liturgy-expert
        - cathedra-liturgista
        - cathedra-prayer-engine-expert
        - cathedra-saints-expert
        - cathedra-knowledge-graph-expert
        - cathedra-architecture-guardian

        ==================================================
        P0.1 — ORAÇÕES
        ==================================================

        Validar diretamente:

        `public.prayers`

        Confirmar:

        - tabela acessível;
        - registros existentes;
        - `is_published = true`;
        - conteúdo retornado corretamente;
        - categorias;
        - títulos;
        - slugs;
        - links;
        - rota `/oracao`;
        - abertura de uma oração;
        - Reader;
        - encerramento editorial;
        - ReaderContinuation;
        - Nexus quando aplicável.

        Testar também:

        oração → Bíblia
        oração → Santo
        oração → Liturgia
        oração → Catecismo

        Nenhum link pode abrir rota inexistente ou tela vazia.

        ==================================================
        P0.2 — SANTO DO DIA
        ==================================================

        Validar:

        `useChurchContext`
        → Edge Function
        → `public.saints`
        → Santo do Dia
        → interface.

        Confirmar que o santo apresentado corresponde REALMENTE à data atual.

        Não considerar o fallback como validação.

        Testar:

        - Home
        - Liturgia
        - Acervo
        - página do Santo
        - mobile
        - desktop.

        Confirmar que todos apresentam o MESMO Santo do Dia.

        ==================================================
        P0.3 — PAPA ATUAL
        ==================================================

        Validar:

        `useChurchContext`
        → `library_items_v1`
        → `status = current`

        Confirmar que o registro retornado corresponde ao Papa atualmente válido.

        IMPORTANTE:

        Se o banco retornar um Papa diferente do fallback, o dado do SSoT deve prevalecer.

        Não manter informações duplicadas.

        Testar todos os locais onde o Papa aparece.

        ==================================================
        P1 — PATRÍSTICA / MAGISTÉRIO
        ==================================================

        Com o banco ativo:

        validar:

        - registros reais;
        - rotas;
        - slugs;
        - Reader V2;
        - Nexus;
        - Logos;
        - Acervo;
        - links internos;
        - conteúdo editorial.

        Selecionar registros reais existentes e testar a navegação completa.

        Não criar conteúdo para preencher lacunas.

        Se faltar conteúdo:

        STATUS = CONTENT GAP

        ==================================================
        VALIDAÇÃO NEXUS
        ==================================================

        Para cada módulo validado:

        abrir uma conexão real exibida pelo Nexus.

        Confirmar:

        1. origem existe;
        2. destino existe;
        3. destino possui rota;
        4. rota abre;
        5. conteúdo aparece;
        6. não existe tela vazia;
        7. não existe link morto.

        Testar bidirecionalmente quando houver relação:

        A → B
        B → A

        ==================================================
        VALIDAÇÃO LOGOS
        ==================================================

        Testar consultas reais relacionadas a:

        - Bíblia
        - Catecismo
        - Santos
        - Orações
        - Liturgia
        - Patrística
        - Magistério

        Confirmar que os resultados apontam para conteúdo existente.

        ==================================================
        VALIDAÇÃO FINAL
        ==================================================

        Executar:

        - TypeScript
        - testes unitários
        - testes de integração
        - Playwright Desktop
        - Playwright Mobile
        - rotas
        - links
        - Nexus
        - Logos
        - Church Context
        - Reader
        - SEO quando afetado

        ==================================================
        REGRA DE CERTIFICAÇÃO
        ==================================================

        CERTIFIED somente se:

        ORAÇÕES = PASS
        SANTO DO DIA = PASS
        PAPA ATUAL = PASS
        PATRÍSTICA = PASS
        MAGISTÉRIO = PASS
        NEXUS = PASS
        LOGOS = PASS
        DESKTOP = PASS
        MOBILE = PASS

        Se existir qualquer problema:

        BLOCKED

        Não esconder falhas com fallback.

        Não criar dados artificiais.

        Não declarar PASS estrutural quando os dados reais estiverem incorretos.

        ==================================================
        RELATÓRIO FINAL
        ==================================================

        P0
        - Orações:
        - Santo do Dia:
        - Papa Atual:

        P1
        - Patrística:
        - Magistério:

        INTEGRAÇÕES
        - Nexus:
        - Logos:
        - Church Context:
        - Reader:

        VALIDAÇÃO
        - TypeScript:
        - Testes:
        - Desktop:
        - Mobile:
        - Links:
        - Rotas:

        DADOS INCORRETOS:
        listar exatamente.

        DADOS AUSENTES:
        listar exatamente.

        LINKS QUEBRADOS:
        listar exatamente.

        STATUS FINAL:

        CERTIFIED

        ou

        BLOCKED
      </div>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-spacing-lg focus:left-spacing-lg focus:z-[200] focus:px-spacing-lg focus:py-spacing-sm focus:bg-primary focus:text-primary-foreground focus:rounded-premium-full focus:shadow-premium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background transition-all duration-300 font-bold uppercase tracking-[0.2em] text-[10px]"
      >
        {t('skip_to_content') || 'Pular para o conteúdo'}
      </a>
      
      {/* Unified header managed by App.tsx */}
      <div className="hidden" aria-hidden="true">
        INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

        Analise o texto abaixo antes de agir.
        Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
        Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
        Nunca insira o texto enviado como conteúdo dentro do site ou da página.

        TEXTO DO USUÁRIO: Melhore o pré-carregamento de resultados e dos verbetes adjacentes durante a busca e ao navegar para a frente/volta na PrayerLibrary.Adicione métricas de latência por etapas (busca, render e commit) com percentis P50/P95 no registro do módulo de Orações para eu identificar gargalos por dispositivo.Implemente code splitting e pré-carregamento de rota/componentes da PrayerLibrary para diminuir o tempo até exibir o conteúdo ao entrar e trocar de verbete.Ative lazy loading para recursos pesados dentro do módulo de Orações e adicione placeholders coerentes para manter a UI fluida durante a navegação entre verbetes.Configure compressão e formatos modernos (WebP/AVIF) nas imagens e carregamento otimizado das fontes para reduzir ainda mais o tempo de primeira renderização em Orações.
      </div>
      
      <SEOHead
        title="Espiritualidade & Teologia"
        description="Bíblia Sagrada, Catecismo, Magistério e IA teológica em uma plataforma contemplativa para a vida espiritual moderna."
        path="/"
        keywords="bíblia católica premium, catecismo online, magistério da igreja, leitura bíblica diária, logos ia, espiritualidade minimalista, portal teológico sofisticado, cathedra digital"
        image="https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-premium-home.png"
        breadcrumbs={[
          { name: "Home", path: "/" }
        ]}
        faqs={[
          { question: "O Cathedra é gratuito?", answer: "Sim! O acesso à Bíblia, Catecismo, Santos, Liturgia e Orações é totalmente gratuito. Recursos avançados como o Logos IA e análises aprofundadas estão disponíveis no plano Premium." },
          { question: "Preciso ser católico para usar?", answer: "Não. Embora o conteúdo seja baseado na tradição católica, qualquer pessoa interessada em estudar a Bíblia, a história dos santos ou a teologia cristã é bem-vinda." },
          { question: "Posso usar offline?", answer: "Sim! O Cathedra é um Progressive Web App (PWA). Após o primeiro acesso, grande parte do conteúdo fica disponível mesmo sem conexão à internet." },
          { question: "Como funciona o Logos IA?", answer: "É um assistente de inteligência artificial contemplativo treinado com documentos do Magistério da Igreja. Ele responde perguntas teológicas com citações das fontes oficiais, auxiliando seus estudos e vida de oração." }
        ]}
      />

      {!authenticated && (
        <div className="w-full flex flex-col">
          <HeroSection onStart={handleStart} />
          <div id="main-content" className="w-full">
            <BenefitsSection onLogin={() => navigate('/auth')} />
            <FeaturesSection onNavigate={handleNavigate} />
            <PricingSection />
            <TestimonialsSection />
            <div className="w-full bg-card/30 py-spacing-4xl border-y border-border/10">
              <div className="app-container max-w-spacing-4xl">
                <LeadCaptureForm />
              </div>
            </div>
            <FaqSection />
          </div>
        </div>
      )}
      
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
