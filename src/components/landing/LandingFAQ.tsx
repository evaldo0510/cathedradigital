/**
 * LandingFAQ — Perguntas frequentes na landing pública.
 *
 * - Usa `Accordion` (Radix) → navegação por teclado nativa (Tab, Enter, Space, ↑/↓).
 * - Tom editorial, sem linguagem de marketing SaaS.
 * - Exportar `LANDING_FAQS` para reuso no JSON-LD (FAQPage) do SEOHead.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  EditorialSection,
  EditorialHeader,
} from "@/components/editorial";

export const LANDING_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "O que é a Cathedra Digital?",
    answer:
      "Um Sanctuarium Digital: biblioteca viva da Tradição católica reunindo Escritura, Catecismo, Magistério, Liturgia, Orações e Santos, todos interligados por uma rede semântica editorial (Nexus). Não é rede social nem app devocional genérico — é um espaço de estudo e oração contemplativa.",
  },
  {
    question: "O conteúdo é gratuito?",
    answer:
      "Sim. Bíblia, Catecismo, Liturgia diária, Orações fundamentais e cinco mensagens diárias com o Logos AI são gratuitos para sempre. O plano Cathedra PRO libera Logos AI ilimitado, Rosário e Via Sacra Premium, Jornadas Ouro e outras camadas de aprofundamento.",
  },
  {
    question: "Como funciona a curadoria? Posso confiar no que leio?",
    answer:
      "Todo verbete e cross-reference passa pelo Índice de Confiança Editorial (ICE), com fontes obrigatórias em Escritura, Catecismo e Magistério. Textos gerados por IA nunca são publicados sem revisão humana. Traduções primárias são certificadas (ICE ≥ 95) antes de irem ao ar.",
  },
  {
    question: "Como funciona o Logos AI?",
    answer:
      "É um assistente de estudo teológico ancorado nas fontes da Cathedra. Não inventa doutrina: cada resposta cita Escritura, Catecismo e Magistério, e você pode abrir os trechos originais dentro do próprio app. Peregrinos têm 5 mensagens por dia; assinantes PRO, uso ilimitado.",
  },
  {
    question: "Para onde vai o dinheiro dos assinantes PRO?",
    answer:
      "50% de cada mensalidade PRO é convertida em doação a obras católicas (formação sacerdotal, missões, caridade). Os outros 50% sustentam infraestrutura, editorial e desenvolvimento. É um modelo de sustento monástico, não de lucro.",
  },
  {
    question: "Preciso ter formação teológica para usar?",
    answer:
      "Não. As Jornadas guiadas partem do essencial e vão aprofundando gradualmente. O Glossário explica cada termo técnico com popovers no próprio texto. Se você sabe fazer o sinal da cruz, tem o suficiente para começar.",
  },
];

const LandingFAQ = () => {
  return (
    <EditorialSection id="faq" aria-labelledby="faq-heading">
      <div className="space-y-3 mb-8">
        <EditorialHeader
          kicker="Interroga · Perguntas"
          title={<span id="faq-heading">Perguntas frequentes</span>}
        />
        <p className="max-w-2xl text-base text-muted-foreground">
          O essencial antes de entrar no silêncio.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="max-w-3xl divide-y divide-border/50 rounded-2xl border border-border/40 bg-primary/[0.02]"
      >
        {LANDING_FAQS.map((faq, idx) => (
          <AccordionItem
            key={faq.question}
            value={`faq-${idx}`}
            className="border-none px-6"
          >
            <AccordionTrigger className="py-5 text-left font-serif text-lg text-primary hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </EditorialSection>
  );
};

export default LandingFAQ;
