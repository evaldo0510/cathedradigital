import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CathedraCard } from "@/components/cathedra/CathedraCard";

const faqs = [
  { q: "O Cathedra é gratuito?", a: "Sim! O acesso à Bíblia, Catecismo, Santos, Liturgia e Orações é totalmente gratuito. Recursos avançados como o Logos IA e análises aprofundadas estão disponíveis no plano Premium." },
  { q: "Preciso ser católico para usar?", a: "Não. Embora o conteúdo seja baseado na tradição católica, qualquer pessoa interessada em estudar a Bíblia, a história dos santos ou a teologia cristã é bem-vinda." },
  { q: "Posso usar offline?", a: "Sim! O Cathedra é um Progressive Web App (PWA). Após o primeiro acesso, grande parte do conteúdo fica disponível mesmo sem conexão à internet." },
  { q: "Como funciona o Logos IA?", a: "É um assistente de inteligência artificial contemplativo treinado com documentos do Magistério da Igreja. Ele responde perguntas teológicas com citações das fontes oficiais, auxiliando seus estudos e vida de oração." },
  { q: "Meus dados estão seguros?", a: "Absolutamente. Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados de oração e estudo são privados e nunca compartilhados." },
  { q: "Posso instalar no celular?", a: "Sim! O Cathedra pode ser instalado como um app no seu dispositivo Android ou iOS diretamente pelo navegador, sem precisar de loja de aplicativos." },
  { q: "Como dou feedback ou peço ajuda?", a: "Você pode usar o botão de feedback no canto inferior da tela a qualquer momento! Adoramos ouvir nossos usuários para tornar o Cathedra cada vez melhor." },
];

const FaqSection = () => (
  <section className="w-full section-spacing relative overflow-hidden">
    <div className="app-container max-w-4xl space-y-20 relative z-10">
      <div className="text-center space-y-6">
        <span className="text-premium-tiny font-bold uppercase tracking-[0.4em] text-primary/70 italic">Dúvidas</span>
        <h2 className="font-display font-bold text-foreground">Perguntas Frequentes</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="rounded-premium border border-border bg-card text-card-foreground shadow-soft transition-all duration-300 hover:shadow-premium hover:border-primary/20 !p-0 px-lg sm:px-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <AccordionTrigger className="text-left font-serif font-bold text-base py-lg hover:no-underline border-none">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-lg">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FaqSection;
