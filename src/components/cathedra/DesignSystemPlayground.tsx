import React from 'react';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { SectionHeader } from './SectionHeader';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';

const DesignSystemPlayground: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead 
        title="Design System Playground | Cathedra" 
        description="Ambiente de testes e documentação dos componentes do Cathedra Digital."
      />
      
      <div className="app-container py-20 md:py-32 space-y-32">
        {/* Header Section */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/[0.03] border border-primary/10 rounded-full">
            <Icons.Sparkles className="w-4 h-4 text-primary/40" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">Design System</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-medium text-primary tracking-tight">itinerarium Visualis</h1>
          <p className="font-serif italic text-muted-foreground/60 text-lg md:text-xl max-w-2xl mx-auto">
            "A beleza é o esplendor da verdade." — Santo Agostinho
          </p>
        </section>

        {/* Typography Section */}
        <section className="space-y-16">
          <SectionHeader title="Tipografia" subtitle="Hierarquia e ritmos para leitura contemplativa." align="left" />
          <div className="premium-card p-10 md:p-20 space-y-12">
            <div className="space-y-4">
              <span className="text-premium-tiny">Display / H1</span>
              <h1 className="text-5xl md:text-7xl">O Verbo se fez carne</h1>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Heading / H2</span>
              <h2>A Tradição Apostólica</h2>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Subheading / H3</span>
              <h3>Os Mistérios da Fé</h3>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Body / Serif</span>
              <p className="font-serif text-lg leading-relaxed">
                A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes. 
                De onde deve partir a oração? Da altura do nosso orgulho e da nossa vontade própria, 
                ou das profundezas de um coração humilde e contrito?
              </p>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Premium Tiny</span>
              <p className="text-premium-tiny">A.M.D.G — Ad maiorem Dei gloriam</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-16">
          <SectionHeader title="Botões" subtitle="Ações e interações com feedback tátil e visual suave." align="left" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <span className="text-premium-tiny">Primary</span>
              <CathedraButton variant="primary" className="w-full">Iniciar Jornada</CathedraButton>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Secondary / Gold</span>
              <CathedraButton variant="secondary" className="w-full">Apoiar Missão</CathedraButton>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Outline</span>
              <CathedraButton variant="outline" className="w-full">Ver Detalhes</CathedraButton>
            </div>
            <div className="space-y-4">
              <span className="text-premium-tiny">Ghost</span>
              <CathedraButton variant="ghost" className="w-full">Voltar</CathedraButton>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-16">
          <SectionHeader title="Cards" subtitle="Recipientes de conteúdo com profundidade monástica." align="left" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <CathedraCard className="p-10 md:p-14 space-y-6">
              <span className="text-premium-tiny">Default Card</span>
              <h3 className="text-2xl font-display">Santuário de Estudo</h3>
              <p className="text-muted-foreground/60 font-serif italic">
                Um espaço para mergulhar na profundidade dos textos sagrados.
              </p>
            </CathedraCard>

            <CathedraCard variant="interactive" className="p-10 md:p-14 space-y-6">
              <span className="text-premium-tiny">Interactive Card</span>
              <h3 className="text-2xl font-display">Jornada de Fé</h3>
              <p className="text-muted-foreground/60 font-serif italic">
                Clique para explorar os caminhos da alma.
              </p>
              <div className="flex justify-end pt-4">
                <Icons.ChevronRight className="w-6 h-6 text-primary/20 group-hover:text-primary transition-all" />
              </div>
            </CathedraCard>
          </div>
        </section>

        {/* Guidelines Section */}
        <section className="space-y-16">
          <SectionHeader title="Diretrizes" subtitle="Regras para manter o silêncio visual e a sofisticação." align="left" />
          <div className="premium-card p-10 md:p-20">
            <div className="prose prose-stone dark:prose-invert max-w-none space-y-12">
              <div className="space-y-4">
                <h4 className="text-xl font-bold uppercase tracking-widest text-primary/80">1. Espaçamento (Vertical Rhythm)</h4>
                <p className="text-muted-foreground/60 leading-relaxed">
                  Utilize as classes de utilitário <code className="text-secondary bg-secondary/5 px-2 py-0.5 rounded">section-spacing</code> para grandes divisões 
                  e <code className="text-secondary bg-secondary/5 px-2 py-0.5 rounded">stack-spacing</code> para componentes empilhados. O respiro é essencial para a contemplação.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold uppercase tracking-widest text-primary/80">2. Bordas e Divisores</h4>
                <p className="text-muted-foreground/60 leading-relaxed">
                  Bordas devem ser quase imperceptíveis (<code className="text-secondary bg-secondary/5 px-2 py-0.5 rounded">border-primary/5</code>). 
                  Divisores verticais devem usar o gradiente de transparência padrão para evitar "linhas duras".
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold uppercase tracking-widest text-primary/80">3. Opacidade e Contraste</h4>
                <p className="text-muted-foreground/60 leading-relaxed">
                  Evite contrastes extremos. Texto secundário deve usar <code className="text-secondary bg-secondary/5 px-2 py-0.5 rounded">text-muted-foreground/60</code>. 
                  Ícones em estado de repouso usam <code className="text-secondary bg-secondary/5 px-2 py-0.5 rounded">opacity-20</code>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemPlayground;