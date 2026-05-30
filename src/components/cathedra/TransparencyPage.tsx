import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Info, Mail, Search, FileText, CheckCircle } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

const TransparencyPage: React.FC = () => {
  return (
    <div className="desktop-layout pt-2xl pb-4xl">
      <SEOHead 
        title="Transparência e Integridade | Cathedra" 
        description="Saiba como os conteúdos da Cathedra são gerados e revisados. Nosso compromisso com a verdade sem uso de Inteligência Artificial."
        path="/transparencia"
      />
      
      <div className="max-w-3xl mx-auto space-y-16 px-md">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-xs px-sm py-2xs rounded-premium bg-primary/10 text-primary text-premium-tiny font-black uppercase tracking-[0.2em] border border-primary/20">
            <ShieldCheck className="w-sm h-sm" />
            Integridade Doutrinária
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-primary leading-tight tracking-tight">
            Transparência
          </h1>
          <p className="text-lg text-muted-foreground italic font-serif">
            "Conhecereis a verdade, e a verdade vos libertará." (Jo 8,32)
          </p>
        </div>

        {/* No AI Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-xl rounded-[2.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-xl opacity-5">
            <Icons.Zap className="w-4xl h-4xl text-primary" />
          </div>
          <div className="relative space-y-6">
            <div className="flex items-center gap-sm text-primary">
              <CheckCircle className="w-lg h-lg" />
              <h2 className="text-xl font-bold uppercase tracking-wider">Compromisso 100% Sem IA</h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-serif text-lg">
              A Cathedra Digital assume o compromisso público de <strong>não utilizar Inteligência Artificial</strong> para a geração de comentários bíblicos, interpretações teológicas ou reflexões espirituais. 
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Diferente de outras plataformas, aqui nenhum algoritmo decide o que é relevante para sua alma. Acreditamos que a transmissão da Fé exige a mediação humana, fundamentada na Tradição e no Magistério Vivo da Igreja.
            </p>
          </div>
        </motion.section>


        {/* Content Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-sm text-primary">
              <Search className="w-md h-md" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Fontes Primárias</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Todos os textos bíblicos e parágrafos do Catecismo são extraídos de edições oficiais e fontes de domínio público reconhecidas. Não realizamos alterações nos textos sagrados.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-sm text-primary">
              <FileText className="w-md h-md" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Revisão Manual</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nossa equipe de curadoria revisa manualmente as conexões entre temas, santos e orações para garantir que a experiência digital reflita a beleza da unidade da fé católica.
            </p>
          </div>
        </div>

        {/* Contact & Review */}
        <section className="space-y-8 pt-xl border-t border-border">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-bold">Contato e Revisão Manual</h2>
            <p className="text-muted-foreground text-sm">Se você encontrar qualquer imprecisão ou desejar sugerir uma melhoria na curadoria, utilize os canais abaixo para uma revisão humana imediata.</p>

          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
            <Button 
              asChild
              className="h-2xl px-xl w-full sm:w-auto shadow-premium-hover"
            >
              <a href="mailto:contato@cathedradigital.com" className="flex items-center gap-sm">
                <Mail className="w-md h-md" />
                Enviar E-mail
              </a>
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                trackEvent('social_link_click', { platform: 'WhatsApp', url: SOCIAL_LINKS.WHATSAPP });
                window.open(SOCIAL_LINKS.WHATSAPP, '_blank');
              }}
              className="h-2xl px-xl border border-primary/20 w-full sm:w-auto shadow-soft gap-sm"
            >
              <Icons.MessageSquare className="w-md h-md" />
              Suporte WhatsApp
            </Button>
          </div>
        </section>

        {/* Offline Mode & Runtime Integrity */}
        <div className="p-xl rounded-[2rem] border border-border text-center space-y-4">
          <Icons.WifiOff className="w-xl h-xl text-muted-foreground mx-auto" />
          <h3 className="font-bold uppercase tracking-widest text-xs text-foreground">Independência de Runtime</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto italic">
            O site foi projetado para funcionar de forma soberana. As chamadas para provedores externos foram reduzidas ao mínimo essencial (Supabase para dados), garantindo que a plataforma opere mesmo sem conexão estável e sem depender de serviços de terceiros que possam comprometer a integridade do conteúdo.
          </p>
          <div className="pt-md">
            <span className="px-md py-xs rounded-full bg-secondary/10 text-primary text-premium-tiny font-black uppercase tracking-widest border border-primary/10">
              PWA Habilitado para Uso Offline
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransparencyPage;
