import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fadeUp } from "./animations";

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
  <section className="w-full py-24 px-6 relative overflow-hidden">
    <div className="max-w-3xl mx-auto space-y-12 relative z-10">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center space-y-4">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary/40">Dúvidas</span>
        <h2 className="text-3xl md:text-4xl font-display font-bold">Perguntas Frequentes</h2>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border/10 rounded-3xl px-8 shadow-sm">
              <AccordionTrigger className="text-left font-serif font-bold text-base py-6 hover:no-underline transition-colors border-none">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-6">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FaqSection;
