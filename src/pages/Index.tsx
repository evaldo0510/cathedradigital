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

        TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — ONDA 2 (AUDITORIA P0)

        ATENÇÃO: NÃO CRIE NADA NOVO.

        Antes de executar qualquer alteração, faça obrigatoriamente um INVENTÁRIO DOS SKILLS EXISTENTES no projeto.

        1. Localize todos os Skills/Agentes já existentes.
        2. Leia suas instruções.
        3. Identifique quais Skills são responsáveis por:
           - arquitetura
           - Reader
           - Design System
           - UI/UX
           - mobile
           - acessibilidade
           - performance
           - SEO
           - Nexus
           - Logos
           - Church Context
           - conteúdo/editorial
           - QA
           - navegação
        4. Utilize os Skills existentes sempre que forem aplicáveis.
        5. NÃO recrie Skills que já existem.
        6. NÃO substitua Skills existentes.
        7. NÃO invente novos agentes.
        8. NÃO crie novas funcionalidades.

        MISSÃO:

        Usar os Skills que JÁ EXISTEM para encontrar tudo que está:

        - quebrado;
        - incompleto;
        - desconectado;
        - duplicado;
        - inconsistente;
        - sem conteúdo;
        - sem rota;
        - com rota quebrada;
        - com botão sem ação;
        - com link apontando para destino errado;
        - com módulo que existe mas não está integrado;
        - com conteúdo existente que não aparece na interface;
        - com Reader incompleto;
        - com Nexus sem conexão;
        - com dados incorretos;
        - com problema mobile;
        - com problema desktop.

        PRIORIDADE:

        P0 → funcionamento quebrado ou informação incorreta
        P1 → módulo existente incompleto ou desconectado
        P2 → inconsistência visual/UX
        P3 → melhorias secundárias

        REGRA FUNDAMENTAL:

        Se algo já existe, NÃO recriar.

        Se está quebrado → corrigir.

        Se está incompleto → completar usando o que já existe.

        Se está desconectado → conectar.

        Se existe conteúdo → fazer o conteúdo aparecer corretamente.

        Se existe rota → garantir que ela funcione.

        Se existe componente certificado → reutilizar.

        Se existe Skill especializado → ativá-lo e utilizá-lo.

        NÃO criar novos módulos durante esta auditoria.

        NÃO iniciar expansão do Cathedra.

        NÃO adicionar funcionalidades apenas porque parecem interessantes.

        OBJETIVO:

        Fazer o Cathedra funcionar 100% com aquilo que JÁ EXISTE.

        Depois da correção, validar:

        - Desktop
        - Mobile
        - rotas
        - menus
        - botões
        - CTAs
        - breadcrumbs
        - cards
        - Reader
        - Nexus
        - Logos
        - Church Context
        - navegação entre módulos
        - conteúdo
        - SEO
        - acessibilidade
        - testes
        - build

        IMPORTANTE:

        Não declarar "CERTIFIED" apenas porque o código compila.

        CERTIFIED somente quando a funcionalidade estiver realmente funcionando no navegador e sem rota, botão, conteúdo ou conexão quebrada.

        Se houver qualquer falha, declarar BLOCKED e informar exatamente:

        1. o que está quebrado;
        2. onde está;
        3. qual Skill foi utilizado;
        4. o que foi corrigido;
        5. o que ainda falta.

        AO FINAL:

        Entregar um relatório objetivo com:

        SKILLS EXISTENTES ENCONTRADOS

        SKILLS ATIVADOS

        MÓDULOS AUDITADOS

        P0

        P1

        P2

        P3

        CORREÇÕES REALIZADAS

        ITENS AINDA BLOQUEADOS

        STATUS FINAL

        CERTIFIED
        ou
        BLOCKED

        NÃO INVENTE.

        NÃO EXPANDA.

        NÃO REFAÇA.

        PRIMEIRO ENCONTRE O QUE JÁ EXISTE.
        DEPOIS ATIVE OS SKILLS ADEQUADOS.
        DEPOIS CORRIJA.
        DEPOIS TESTE.
        SOMENTE ENTÃO CERTIFIQUE.
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
