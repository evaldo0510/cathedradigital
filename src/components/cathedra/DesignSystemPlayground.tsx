import React, { useState } from 'react';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { CathedraInput } from './CathedraInput';
import { CathedraOverlay } from './CathedraOverlay';
import { SectionHeader } from './SectionHeader';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';

const DesignSystemPlayground: React.FC = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEOHead 
        title="Design System Playground | Cathedra" 
        description="Ambiente de testes e documentação dos componentes do Cathedra Digital."
        path="/design-system"
      />
      
      <div className="app-container py-spacing-3xl md:py-spacing-4xl stack-spacing">
        {/* Header Section */}
        <section className="text-center space-y-spacing-xl">
          <div className="inline-flex items-center gap-spacing-sm px-spacing-lg py-spacing-xs bg-primary/[0.03] border border-primary/10 rounded-premium-full animate-in fade-in duration-1000">
            <Icons.Sparkles className="w-spacing-md h-spacing-md text-primary/40" />
            <span className="h5 !text-primary/40 tracking-[0.5em]">Systema Visualis</span>
          </div>
          <h1 className="text-premium-5xl md:text-7xl lg:text-8xl tracking-tighter">itinerarium</h1>
          <p className="font-serif italic text-muted-foreground/60 text-premium-lg md:text-premium-xl max-w-spacing-2xl mx-auto leading-relaxed">
            "A beleza é o esplendor da verdade." — Santo Agostinho
          </p>
        </section>

        {/* Typography Section */}
        <section className="space-y-spacing-3xl">
          <SectionHeader title="Tipografia" subtitle="Hierarquia e ritmos para leitura contemplativa." align="left" />
          <div className="premium-card p-spacing-xl md:p-spacing-3xl space-y-spacing-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-3xl">
              <div className="space-y-spacing-2xl">
                <div className="space-y-spacing-md">
                  <span className="h5 text-secondary">Display / H1</span>
                  <h1>Fiat Lux</h1>
                </div>
                <div className="space-y-spacing-md">
                  <span className="h5 text-secondary">Heading / H2</span>
                  <h2>Sovereign Authority</h2>
                </div>
                <div className="space-y-spacing-md">
                  <span className="h5 text-secondary">Subheading / H3</span>
                  <h3>The Mysteries of Faith</h3>
                </div>
              </div>
              <div className="space-y-spacing-2xl">
                <div className="space-y-spacing-md">
                  <span className="h5 text-secondary">UI Medium / H4</span>
                  <h4>Contemplative Navigation</h4>
                </div>
                <div className="space-y-spacing-md">
                  <span className="h5 text-secondary">Body / Standard</span>
                  <p>
                    A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes. 
                    De onde deve partir a oração? Da altura do nosso orgulho e da nossa vontade própria.
                  </p>
                </div>
                <div className="space-y-spacing-md">
                  <span className="h5 text-secondary">Reading / Serif</span>
                  <p className="reader-text !mx-spacing-0">
                    No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus. 
                    Ele estava no princípio com Deus. Todas as coisas foram feitas por intermédio dele.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section className="space-y-spacing-3xl">
          <SectionHeader title="Componentes" subtitle="Elementos modulares com feedback tátil premium." align="left" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-xl">
            <div className="space-y-spacing-md">
              <span className="h5 opacity-40">Primary Button</span>
              <CathedraButton variant="primary" className="w-full">Iniciar</CathedraButton>
            </div>
            <div className="space-y-spacing-md">
              <span className="h5 opacity-40">Secondary Button</span>
              <CathedraButton variant="secondary" className="w-full">Apoiar</CathedraButton>
            </div>
            <div className="space-y-spacing-md">
              <span className="h5 opacity-40">Outline Button</span>
              <CathedraButton variant="outline" className="w-full">Detalhes</CathedraButton>
            </div>
            <div className="space-y-spacing-md">
              <span className="h5 opacity-40">Ghost Button</span>
              <CathedraButton variant="ghost" className="w-full">Voltar</CathedraButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-2xl pt-spacing-2xl">
            <div className="space-y-spacing-xl">
              <span className="h5 opacity-40">Input Fields</span>
              <CathedraInput 
                label="Email" 
                placeholder="exemplo@igreja.org" 
                icon={<Icons.Mail className="w-spacing-md h-spacing-md" />}
              />
              <CathedraInput 
                label="Senha" 
                type="password" 
                placeholder="••••••••" 
                error="Senha muito curta"
                icon={<Icons.Lock className="w-spacing-md h-spacing-md" />}
              />
            </div>
            <div className="space-y-spacing-xl flex flex-col justify-end">
              <span className="h5 opacity-40">Overlays & Modals</span>
              <CathedraCard variant="interactive" className="p-spacing-2xl flex flex-col items-center justify-center gap-spacing-lg" onClick={() => setIsOverlayOpen(true)}>
                <Icons.Maximize className="w-spacing-xl h-spacing-xl text-secondary" />
                <h4 className="text-center">Abrir Overlay Premium</h4>
              </CathedraCard>
            </div>
          </div>
        </section>

        {/* Guidelines Section */}
        <section className="space-y-spacing-3xl">
          <SectionHeader title="Ratio et Regula" subtitle="Princípios para manter o silêncio visual." align="left" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-spacing-xl">
            <CathedraCard padding="sm" className="space-y-spacing-md">
              <h5 className="text-secondary">Silêncio Visual</h5>
              <p className="text-premium-sm opacity-60">
                Evite elementos desnecessários. O espaço em branco é um elemento de design ativo que convida à reflexão.
              </p>
            </CathedraCard>
            <CathedraCard padding="sm" className="space-y-spacing-md">
              <h5 className="text-secondary">Ritmo Vertical</h5>
              <p className="text-premium-sm opacity-60">
                Utilize as classes <code className="text-secondary">stack-spacing</code> e <code className="text-secondary">section-spacing</code> para garantir consistência.
              </p>
            </CathedraCard>
            <CathedraCard padding="sm" className="space-y-spacing-md">
              <h5 className="text-secondary">Feedback Tátil</h5>
              <p className="text-premium-sm opacity-60">
                Toda interação deve ter uma resposta sutil e orgânica, simulando a sensação de um objeto real.
              </p>
            </CathedraCard>
          </div>
        </section>
      </div>

      <CathedraOverlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)}>
        <div className="space-y-spacing-2xl">
          <SectionHeader title="Santuário Digital" subtitle="Um espaço de oração e estudo sem distrações." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-2xl">
            <p className="reader-text !mx-spacing-0 !text-premium-lg">
              Esta é uma experiência de overlay premium, projetada para focar a atenção do usuário no que é essencial. 
              Utiliza desfoque de fundo (blur) e tipografia generosa.
            </p>
            <div className="space-y-spacing-lg">
              <CathedraButton className="w-full">Confirmar Itinerário</CathedraButton>
              <CathedraButton variant="outline" className="w-full" onClick={() => setIsOverlayOpen(false)}>Fechar</CathedraButton>
            </div>
          </div>
        </div>
      </CathedraOverlay>
    </div>
  );
};

export default DesignSystemPlayground;