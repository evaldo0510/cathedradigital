import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import ContemplativeLayout from './ContemplativeLayout';

import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

const TransparencyPage: React.FC = () => {
  return (
    <ContemplativeLayout>
      <SEOHead 
        title="Transparência e Integridade | Cathedra" 
        description="Saiba como os conteúdos da Cathedra são gerados e revisados. Nosso compromisso com a verdade sem uso de Inteligência Artificial."
        path="/transparencia"
      />
      
      <div className="w-full space-y-spacing-3xl px-spacing-md">
        {/* Header */}
        <div className="text-center space-y-spacing-md">
          <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs rounded-premium bg-primary/10 text-primary text-premium-xs font-black uppercase tracking-[0.2em] border border-primary/20">
            <Icons.ShieldCheck className="w-spacing-sm h-spacing-sm" />
            Integridade Doutrinária
          </div>
          <h1 className="text-premium-4xl md:text-premium-6xl font-display font-black text-primary leading-tight tracking-tight">
            Transparência
          </h1>
          <p className="text-premium-lg text-muted-foreground italic font-serif">
            "Conhecereis a verdade, e a verdade vos libertará." (Jo 8,32)
          </p>
        </div>

        {/* No AI Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-spacing-xl rounded-[2.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-spacing-0 right-0 p-spacing-xl opacity-5">
            <Icons.Zap className="w-spacing-4xl h-spacing-4xl text-primary" />
          </div>
          <div className="relative space-y-spacing-lg">
            <div className="flex items-center gap-spacing-sm text-primary">
              <Icons.CheckCircle className="w-spacing-lg h-spacing-lg" />
              <h2 className="text-premium-xl font-bold uppercase tracking-wider">Compromisso 100% Sem IA</h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-serif text-premium-lg">
              A Cathedra Digital assume o compromisso público de <strong>não utilizar Inteligência Artificial</strong> para a geração de comentários bíblicos, interpretações teológicas ou reflexões espirituais. 
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Diferente de outras plataformas, aqui nenhum algoritmo decide o que é relevante para sua alma. Acreditamos que a transmissão da Fé exige a mediação humana, fundamentada na Tradição e no Magistério Vivo da Igreja.
            </p>
          </div>
        </motion.section>


        {/* Content Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-xl">
          <div className="space-y-spacing-md">
            <div className="flex items-center gap-spacing-sm text-primary">
              <Icons.Search className="w-spacing-md h-spacing-md" />
              <h3 className="font-bold uppercase tracking-widest text-premium-xs">Fontes Primárias</h3>
            </div>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">
              Todos os textos bíblicos e parágrafos do Catecismo são extraídos de edições oficiais e fontes de domínio público reconhecidas. Não realizamos alterações nos textos sagrados.
            </p>
          </div>
          <div className="space-y-spacing-md">
            <div className="flex items-center gap-spacing-sm text-primary">
              <Icons.FileText className="w-spacing-md h-spacing-md" />
              <h3 className="font-bold uppercase tracking-widest text-premium-xs">Revisão Manual</h3>
            </div>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">
              Nossa equipe de curadoria revisa manualmente as conexões entre temas, santos e orações para garantir que a experiência digital reflita a beleza da unidade da fé católica.
            </p>
          </div>
        </div>

        {/* Contact & Review */}
        <section className="space-y-spacing-xl pt-spacing-xl border-t border-border">
          <div className="text-center space-y-spacing-xs">
            <h2 className="text-premium-2xl font-display font-bold">Contato e Revisão Manual</h2>
            <p className="text-muted-foreground text-premium-sm">Se você encontrar qualquer imprecisão ou desejar sugerir uma melhoria na curadoria, utilize os canais abaixo para uma revisão humana imediata.</p>

          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-spacing-md">
            <Button 
              asChild
              className="h-spacing-2xl px-spacing-xl w-full sm:w-auto shadow-premium-hover"
            >
              <a href="mailto:contato@cathedradigital.com" className="flex items-center gap-spacing-sm">
                <Icons.Mail className="w-spacing-md h-spacing-md" />
                Enviar E-mail
              </a>
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                trackEvent('social_link_click', { platform: 'WhatsApp', url: SOCIAL_LINKS.WHATSAPP });
                window.open(SOCIAL_LINKS.WHATSAPP, '_blank');
              }}
              className="h-spacing-2xl px-spacing-xl border border-primary/20 w-full sm:w-auto shadow-premium-md gap-spacing-sm"
            >
              <Icons.MessageSquare className="w-spacing-md h-spacing-md" />
              Suporte WhatsApp
            </Button>
          </div>
        </section>

        {/* Offline Mode & Runtime Integrity */}
        <div className="p-spacing-xl rounded-[2rem] border border-border text-center space-y-spacing-md">
          <Icons.WifiOff className="w-spacing-xl h-spacing-xl text-muted-foreground mx-auto" />
          <h3 className="font-bold uppercase tracking-widest text-premium-xs text-foreground">Independência de Runtime</h3>
          <p className="text-premium-xs text-muted-foreground leading-relaxed max-w-spacing-md mx-auto italic">
            O site foi projetado para funcionar de forma soberana. As chamadas para provedores externos foram reduzidas ao mínimo essencial (Supabase para dados), garantindo que a plataforma opere mesmo sem conexão estável e sem depender de serviços de terceiros que possam comprometer a integridade do conteúdo.
          </p>
          <div className="pt-spacing-md">
            <span className="px-spacing-md py-spacing-xs rounded-premium-full bg-secondary/10 text-primary text-premium-xs font-black uppercase tracking-widest border border-primary/10">
              PWA Habilitado para Uso Offline
            </span>
          </div>
        </div>

      </div>
    </ContemplativeLayout>
  );
};

export default TransparencyPage;
