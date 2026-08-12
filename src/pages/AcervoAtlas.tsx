import React from 'react';
import { Helmet } from 'react-helmet-async';
import { EditorialHero, EditorialDivider } from '@/components/editorial/harmony';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';

const AcervoAtlas: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Atlas Católico — Geografia da Tradição</title>
      </Helmet>

      <EditorialHero align="center" density="minimal" className="bg-primary/5">
        <EditorialHero.Meta>Mosteiro Digital · Atlas Católico</EditorialHero.Meta>
        <EditorialHero.Title>Geografia da Fé</EditorialHero.Title>
        <EditorialHero.Subtitle>Explore o patrimônio da Igreja através do tempo e do espaço.</EditorialHero.Subtitle>
      </EditorialHero>

      <main className="max-w-6xl mx-auto px-6 mt-12 space-y-12">
        <div className="aspect-video bg-card border border-primary/10 rounded-premium flex flex-col items-center justify-center space-y-4 shadow-premium-sm overflow-hidden relative">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
           <Icons.Globe className="w-16 h-16 text-gold/40 animate-pulse" />
           <div className="text-center space-y-2 z-10">
             <h2 className="text-2xl font-serif font-bold italic">Cartografia da Tradição</h2>
             <p className="text-muted-foreground text-sm max-w-md mx-auto">
               Em breve: Um mapa interativo conectando aparições, santos, concílios e basílicas ao Nexus teológico.
             </p>
             <Badge variant="outline" className="mt-4 border-gold/30 text-gold uppercase tracking-[0.2em] font-bold">Fase 10.1</Badge>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AtlasFeatureCard 
            icon={Icons.Star}
            title="Aparições"
            desc="Locais das visitas de Nossa Senhora certificadas pela Igreja."
          />
          <AtlasFeatureCard 
            icon={Icons.Church}
            title="Concílios"
            desc="Onde a doutrina foi definida ao longo dos séculos."
          />
          <AtlasFeatureCard 
            icon={Icons.User}
            title="Santos & Papas"
            desc="Nascimento, atuação e legados geográficos."
          />
        </div>

        <EditorialDivider variant="gold-fade" className="opacity-20" />

        <div className="p-8 bg-primary/5 rounded-premium border border-primary/10 text-center">
           <p className="text-muted-foreground text-sm italic">
             "O Atlas Católico não é apenas um mapa geográfico, mas um mapa da tradição cristã."
           </p>
        </div>
      </main>
    </div>
  );
};

const AtlasFeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="bg-card border border-border p-6 rounded-premium space-y-3 hover:border-gold/30 transition-all group">
    <Icon className="w-6 h-6 text-primary/40 group-hover:text-gold transition-colors" />
    <h3 className="font-serif font-bold">{title}</h3>
    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

export default AcervoAtlas;
