import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Book, Cross, MessageSquare, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    return `https://wa.me/5511999999999?text=${text}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-[2rem] p-8 md:p-12"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {!showResult ? (
          <div className="space-y-8">
            {currentStep <= steps.length - 1 ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-secondary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{steps[currentStep].title}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary leading-tight">
                    {steps[currentStep].question}
                  </h2>
                </div>

                <div className="grid gap-3">
                  {steps[currentStep].options?.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleOptionSelect(opt.value)}
                      className="group flex items-center justify-between p-6 rounded-full border border-border bg-background hover:border-secondary hover:bg-secondary/5 transition-all text-left"
                    >
                      <span className="text-lg font-serif">{opt.label}</span>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-secondary" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-2">
                    {steps.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-8 bg-secondary' : 'w-2 bg-border'}`} 
                      />
                    ))}
                    <div className={`h-1.5 rounded-full transition-all ${currentStep === steps.length ? 'w-8 bg-secondary' : 'w-2 bg-border'}`} />
                  </div>
                  {currentStep > 0 && (
                    <button 
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-serif"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-secondary">
                    <Mail className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quase lá</span>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-primary">
                    Onde devemos enviar seu roteiro espiritual?
                  </h2>
                  <p className="text-muted-foreground font-serif italic">
                    Para que possamos acompanhar sua caminhada e enviar o material exclusivo.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-14 rounded-full border-border bg-background font-serif"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 rounded-full border-border bg-background font-serif"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
                >
                  {isSubmitting ? 'Gerando seu roteiro...' : 'Começar a Jornada'}
                </Button>

                <button 
                  type="button"
                  onClick={() => setCurrentStep(steps.length - 1)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-serif"
                >
                  <ArrowLeft className="w-4 h-4" /> Revisar respostas
                </button>
              </form>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-secondary">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary">Seu Roteiro está pronto!</h2>
              <p className="text-muted-foreground font-serif italic">
                Enviamos uma cópia completa para seu e-mail, mas aqui está o início da sua reflexão:
              </p>
            </div>

            <div className="grid gap-6">
              <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-3">
                <div className="flex items-center gap-2 text-secondary">
                  <Book className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">A Palavra de Deus</span>
                </div>
                <p className="text-lg font-serif italic text-primary">
                  "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei." (Mt 11,28)
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Cross className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Catecismo</span>
                </div>
                <p className="text-sm font-serif text-muted-foreground">
                  "A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes." (§2559)
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Logos IA: Apoio Contemplativo</span>
                </div>
                <p className="text-sm font-serif italic leading-relaxed">
                  Percebo que você busca paz em meio ao cansaço. Saiba que o silêncio não é ausência, mas a plenitude da presença divina que restaura as forças.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                asChild
                className="flex-1 h-14 rounded-full text-[10px] font-black uppercase tracking-[0.1em]"
              >
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  Aprofundar via WhatsApp
                </a>
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="h-14 rounded-full text-[10px] font-black uppercase tracking-[0.1em] px-8"
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