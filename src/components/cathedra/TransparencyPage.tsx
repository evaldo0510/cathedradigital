import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import SEOHead from '@/components/SEOHead';
import { ShieldCheck, Info, Mail, Search, FileText, CheckCircle } from 'lucide-react';

const TransparencyPage: React.FC = () => {
  return (
    <div className="desktop-layout pt-12 pb-24">
      <SEOHead 
        title="Transparência e Integridade | Cathedra" 
        description="Saiba como os conteúdos da Cathedra são gerados e revisados. Nosso compromisso com a verdade sem uso de Inteligência Artificial."
        path="/transparencia"
      />
      
      <div className="max-w-3xl mx-auto space-y-16 px-4">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
            <ShieldCheck className="w-3 h-3" />
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
          className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Icons.Zap className="w-24 h-24 text-primary" />
          </div>
          <div className="relative space-y-6">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle className="w-6 h-6" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Search className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Fontes Primárias</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Todos os textos bíblicos e parágrafos do Catecismo são extraídos de edições oficiais e fontes de domínio público reconhecidas. Não realizamos alterações nos textos sagrados.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <FileText className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Revisão Manual</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nossa equipe de curadoria revisa manualmente as conexões entre temas, santos e orações para garantir que a experiência digital reflita a beleza da unidade da fé católica.
            </p>
          </div>
        </div>

        {/* Contact & Review */}
        <section className="space-y-8 pt-8 border-t border-border">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-bold">Dúvidas ou Correções?</h2>
            <p className="text-muted-foreground text-sm">Se você encontrar qualquer imprecisão, entre em contato para que possamos realizar a revisão manual imediata.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="mailto:contato@cathedradigital.com" 
              className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary transition-all w-full sm:w-auto justify-center"
            >
              <Mail className="w-4 h-4" />
              Enviar E-mail
            </a>
            <button 
              onClick={() => window.open('https://wa.me/seunumerowhatsapp', '_blank')}
              className="flex items-center gap-3 px-8 py-4 bg-secondary text-primary rounded-2xl font-black uppercase text-[10px] tracking-widest border border-primary/20 hover:bg-secondary/80 transition-all w-full sm:w-auto justify-center"
            >
              <Icons.MessageSquare className="w-4 h-4" />
              Suporte WhatsApp
            </button>
          </div>
        </section>

        {/* Offline Mode Info */}
        <div className="p-8 rounded-[2rem] border border-border text-center space-y-4">
          <Icons.WifiOff className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-bold uppercase tracking-widest text-xs text-foreground">Modo Offline e Dependências</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            O site foi projetado para funcionar de forma independente. Cache local é utilizado para armazenar textos fundamentais, reduzindo a dependência de serviços externos e garantindo sua privacidade e disponibilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPage;
