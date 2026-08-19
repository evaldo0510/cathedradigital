import React from 'react';
import { EditorialHero } from '@/components/editorial/harmony';
import { SpaceLayout, SpaceFooter } from '@/components/cathedra/space/SpaceLayout';
import { Button } from '@/components/ui/button';
import { Instagram, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function SobrePassaportePage() {
  return (
    <div className="min-h-screen bg-[#FDF8F3]" data-space="cloister">
      <Helmet>
        <title>Sobre o Passaporte · Cathedra Digital</title>
      </Helmet>
      
      <SpaceLayout>
        <EditorialHero density="expanded" align="center">
          <EditorialHero.Eyebrow>Inovação & Espiritualidade</EditorialHero.Eyebrow>
          <EditorialHero.Title>O Passaporte da Cliente</EditorialHero.Title>
          <EditorialHero.Subtitle>
            Uma nova forma de conectar sua jornada profissional à profundidade do mosteiro digital.
          </EditorialHero.Subtitle>
        </EditorialHero>

        <div className="max-w-3xl mx-auto space-y-16 py-12">
          <section className="space-y-6">
            <div className="flex items-center gap-4 text-primary">
              <Zap className="w-6 h-6 text-gold" />
              <h2 className="font-display text-2xl italic">Personalização Exclusiva</h2>
            </div>
            <p className="font-reader text-lg leading-relaxed text-muted-foreground">
              Com o Cathedra Digital, você não é apenas uma usuária, mas uma autoridade. Personalize sua marca, inclua seu Instagram e gere relatórios profissionais com QR Code que conectam diretamente ao seu perfil.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-premium border border-gold-text/20 bg-white shadow-sm space-y-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h3 className="font-display text-xl">Credibilidade</h3>
              <p className="font-reader text-sm text-muted-foreground">
                Documentos exportados com selo de autenticidade e sua assinatura profissional.
              </p>
            </div>
            <div className="p-8 rounded-premium border border-gold-text/20 bg-white shadow-sm space-y-4">
              <Instagram className="w-8 h-8 text-gold" />
              <h3 className="font-display text-xl">Conectividade</h3>
              <p className="font-reader text-sm text-muted-foreground">
                Leve suas clientes do PDF diretamente para seu Instagram com QR Codes integrados.
              </p>
            </div>
          </section>

          <div className="text-center pt-8">
            <p className="font-display text-2xl italic text-primary mb-8">
              "A beleza da ordem é o reflexo da sabedoria."
            </p>
            <Button 
              size="lg" 
              className="rounded-premium-full px-12 gap-2 h-14 uppercase tracking-widest font-bold text-xs"
              onClick={() => window.open('https://instagram.com/cathedradigital', '_blank')}
            >
              Conheça nosso Instagram
              <Instagram className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <SpaceFooter 
          note="Construa seu legado digital com propósito."
          links={[
            { label: 'Meu Perfil', to: '/conta/perfil', hint: 'Personalizar agora' },
            { label: 'Início', to: '/', hint: 'Voltar ao Átrio' },
          ]}
        />
      </SpaceLayout>
    </div>
  );
}
