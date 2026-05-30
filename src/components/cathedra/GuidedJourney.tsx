import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Book, Cross, MessageSquare, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SOCIAL_LINKS } from '@/config/site-config';
import { trackEvent } from '@/lib/analytics';

interface Step {
  title: string;
  question?: string;
  options?: { label: string; value: string }[];
}

const steps: Step[] = [
  {
    title: "Bem-vindo à sua jornada",
    question: "Como você se sente hoje em sua vida espiritual?",
    options: [
      { label: "Cansado e sobrecarregado", value: "cansaço" },
      { label: "Em busca de propósito", value: "busca" },
      { label: "Grato pelas bênçãos", value: "gratidão" },
      { label: "Com dúvidas na fé", value: "dúvida" },
    ]
  },
  {
    title: "Sua prática diária",
    question: "Como você descreveria sua vida de oração atual?",
    options: [
      { label: "Constante e profunda", value: "constante" },
      { label: "Iniciando agora", value: "iniciante" },
      { label: "Sinto-me um pouco afastado", value: "afastado" },
      { label: "Sinto que está 'seca'", value: "seca" },
    ]
  },
  {
    title: "Seu objetivo",
    question: "O que você mais busca neste momento?",
    options: [
      { label: "Paz interior e silêncio", value: "paz" },
      { label: "Conhecimento doutrinário", value: "conhecimento" },
      { label: "Direção para decisões", value: "direção" },
      { label: "Aprofundar na Palavra", value: "aprofundar" },
    ]
  }
];

const GuidedJourney = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();

  const handleOptionSelect = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(currentStep + 1); // Move to lead form step
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('app_metrics').insert({
        metric_type: 'journey_lead',
        metadata: {
          name,
          email,
          answers,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;
      
      setShowResult(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao salvar",
        description: "Não conseguimos iniciar sua jornada. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    const theme = answers[0] || "espiritualidade";
    const text = encodeURIComponent(`Olá! Concluí minha jornada guiada no Cathedra sobre o tema "${theme}". Gostaria de aprofundar minha reflexão.`);
    return `${SOCIAL_LINKS.WHATSAPP}?text=${text}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background p-spacing-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-spacing-2xl bg-card border border-border shadow-premium-hover rounded-[2rem] p-spacing-xl md:p-spacing-2xl"
      >
        <Button 
          onClick={onClose}
          className="absolute top-spacing-lg right-spacing-lg text-muted-foreground hover:text-foreground p-spacing-xs rounded-premium-full hover:bg-muted transition-colors"
        >
          <X className="w-spacing-lg h-spacing-lg" />
        </Button>

        {!showResult ? (
          <div className="space-y-spacing-xl">
            {currentStep <= steps.length - 1 ? (
              <>
                <div className="space-y-spacing-xs">
                  <div className="flex items-center gap-spacing-xs text-secondary">
                    <Sparkles className="w-spacing-md h-spacing-md" />
                    <span className="text-premium-xs font-black uppercase tracking-[0.2em]">{steps[currentStep].title}</span>
                  </div>
                  <h2 className="text-premium-3xl md:text-premium-4xl font-serif font-bold text-primary leading-tight">
                    {steps[currentStep].question}
                  </h2>
                </div>

                <div className="grid gap-spacing-sm">
                  {steps[currentStep].options?.map((opt) => (
                    <Button
                      key={opt.value}
                      onClick={() => handleOptionSelect(opt.value)}
                      className="group flex items-center justify-between p-spacing-lg rounded-premium-full border border-border bg-background hover:border-secondary hover:bg-secondary/5 transition-all text-left"
                    >
                      <span className="text-premium-lg font-serif">{opt.label}</span>
                      <ArrowRight className="w-spacing-md h-spacing-md opacity-0 group-hover:opacity-100 transition-opacity text-secondary" />
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-spacing-md">
                  <div className="flex gap-spacing-xs">
                    {steps.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-spacing-2xs rounded-premium-full transition-all ${i === currentStep ? 'w-spacing-xl bg-secondary' : 'w-spacing-xs bg-border'}`} 
                      />
                    ))}
                    <div className={`h-spacing-2xs rounded-premium-full transition-all ${currentStep === steps.length ? 'w-spacing-xl bg-secondary' : 'w-spacing-xs bg-border'}`} />
                  </div>
                  {currentStep > 0 && (
                    <Button 
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex items-center gap-spacing-xs text-premium-sm text-muted-foreground hover:text-foreground font-serif"
                    >
                      <ArrowLeft className="w-spacing-md h-spacing-md" /> Voltar
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-spacing-xl py-spacing-md">
                <div className="space-y-spacing-xs">
                  <div className="flex items-center gap-spacing-xs text-secondary">
                    <Mail className="w-spacing-md h-spacing-md" />
                    <span className="text-premium-xs font-black uppercase tracking-[0.2em]">Quase lá</span>
                  </div>
                  <h2 className="text-premium-3xl font-serif font-bold text-primary">
                    Onde devemos enviar seu roteiro espiritual?
                  </h2>
                  <p className="text-muted-foreground font-serif italic">
                    Para que possamos acompanhar sua caminhada e enviar o material exclusivo.
                  </p>
                </div>

                <div className="space-y-spacing-md">
                  <div className="relative">
                    <User className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
                    <Input
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-spacing-2xl h-spacing-2xl rounded-premium-full border-border bg-background font-serif"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-spacing-2xl h-spacing-2xl rounded-premium-full border-border bg-background font-serif"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-spacing-2xl rounded-premium-full text-premium-xs font-black uppercase tracking-[0.2em] shadow-premium-hover"
                >
                  {isSubmitting ? 'Gerando seu roteiro...' : 'Começar a Jornada'}
                </Button>

                <Button 
                  type="button"
                  onClick={() => setCurrentStep(steps.length - 1)}
                  className="w-full flex items-center justify-center gap-spacing-xs text-premium-sm text-muted-foreground hover:text-foreground font-serif"
                >
                  <ArrowLeft className="w-spacing-md h-spacing-md" /> Revisar respostas
                </Button>
              </form>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-spacing-xl"
          >
            <div className="text-center space-y-spacing-xs">
              <div className="w-spacing-3xl h-spacing-3xl bg-secondary/10 rounded-premium flex items-center justify-center mx-auto mb-spacing-md text-secondary">
                <Sparkles className="w-spacing-xl h-spacing-xl" />
              </div>
              <h2 className="text-premium-3xl font-serif font-bold text-primary">Seu Roteiro está pronto!</h2>
              <p className="text-muted-foreground font-serif italic">
                Enviamos uma cópia completa para seu e-mail, mas aqui está o início da sua reflexão:
              </p>
            </div>

            <div className="grid gap-spacing-lg">
              <div className="p-spacing-lg rounded-premium bg-secondary/5 border border-secondary/20 space-y-spacing-sm">
                <div className="flex items-center gap-spacing-xs text-secondary">
                  <Book className="w-spacing-md h-spacing-md" />
                  <span className="text-premium-xs font-black uppercase tracking-widest">A Palavra de Deus</span>
                </div>
                <p className="text-premium-lg font-serif italic text-primary">
                  "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei." (Mt 11,28)
                </p>
              </div>

              <div className="p-spacing-lg rounded-premium bg-primary/5 border border-primary/10 space-y-spacing-sm">
                <div className="flex items-center gap-spacing-xs text-primary">
                  <Cross className="w-spacing-md h-spacing-md" />
                  <span className="text-premium-xs font-black uppercase tracking-widest">Catecismo</span>
                </div>
                <p className="text-premium-sm font-serif text-muted-foreground">
                  "A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes." (§2559)
                </p>
              </div>

              <div className="p-spacing-lg rounded-premium bg-muted/30 border border-border space-y-spacing-sm">
                <div className="flex items-center gap-spacing-xs text-muted-foreground">
                  <MessageSquare className="w-spacing-md h-spacing-md" />
                  <span className="text-premium-xs font-black uppercase tracking-widest">Logos IA: Apoio Contemplativo</span>
                </div>
                <p className="text-premium-sm font-serif italic leading-relaxed">
                  Percebo que você busca paz em meio ao cansaço. Saiba que o silêncio não é ausência, mas a plenitude da presença divina que restaura as forças.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-spacing-sm">
              <Button 
                asChild
                className="flex-1 h-spacing-2xl rounded-premium-full text-premium-xs font-black uppercase tracking-[0.1em]"
              >
                <a 
                  href={getWhatsAppLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('social_link_click', { platform: 'WhatsApp', url: getWhatsAppLink() })}
                >
                  Aprofundar via WhatsApp
                </a>
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="h-spacing-2xl rounded-premium-full text-premium-xs font-black uppercase tracking-[0.1em] px-spacing-xl"
              >
                Concluir
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default GuidedJourney;