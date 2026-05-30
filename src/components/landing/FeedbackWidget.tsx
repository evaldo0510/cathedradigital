import React, { useState } from 'react';
import { MessageSquare, Send, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback && rating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('app_metrics')
        .insert([
          { 
            metric_type: 'feedback', 
            metadata: { 
              content: feedback, 
              rating,
              url: window.location.href,
              user_agent: navigator.userAgent
            } 
          }
        ]);

      if (error) throw error;
      setSubmitted(true);
      setFeedback('');
      setRating(0);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-spacing-3xl right-spacing-md lg:bottom-spacing-lg lg:right-spacing-lg z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-spacing-3xl right-0 w-[320px] bg-card border border-border shadow-premium-hover rounded-premium-full p-spacing-lg overflow-hidden"
          >
            {submitted ? (
              <div className="text-center py-spacing-xl space-y-spacing-md">
                <div className="w-spacing-3xl h-spacing-3xl bg-primary/10 rounded-premium flex items-center justify-center mx-auto">
                  <Send className="w-spacing-xl h-spacing-xl text-primary" />
                </div>
                <h3 className="text-premium-xl font-serif font-bold">Obrigado!</h3>
                <p className="text-premium-sm text-muted-foreground font-serif italic">
                  Seu feedback é precioso para construirmos o Cathedra juntos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-spacing-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-premium-lg">Deixe seu feedback</h3>
                  <Button type="button" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-spacing-md h-spacing-md" />
                  </Button>
                </div>
                
                <p className="text-premium-xs text-muted-foreground font-serif italic mb-spacing-md">
                  Como podemos tornar o Cathedra mais acolhedor para você?
                </p>

                <div className="flex gap-spacing-xs justify-center py-spacing-xs">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all ${rating >= star ? 'text-secondary scale-110' : 'text-muted-foreground/30'}`}
                    >
                      <Star className="w-spacing-lg h-spacing-lg fill-current" />
                    </Button>
                  ))}
                </div>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="O que você achou do projeto? O que falta para você começar a usar?"
                  className="w-full h-spacing-4xl px-spacing-md py-spacing-sm rounded-premium-full border border-border bg-background text-premium-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-serif"
                />

                <Button 
                  type="submit" 
                  disabled={isSubmitting || (!feedback && rating === 0)}
                  className="w-full rounded-premium-full font-bold uppercase tracking-widest text-premium-xs h-spacing-2xl"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-spacing-xs p-spacing-sm lg:px-spacing-md lg:py-spacing-sm bg-background border border-border text-foreground rounded-premium-full shadow-premium-hover font-bold uppercase tracking-widest text-premium-xs min-w-spacing-0"
      >
        <MessageSquare className="w-spacing-md h-spacing-md shrink-0" />
        <span className="hidden lg:inline">{isOpen ? 'Fechar' : 'Feedback'}</span>
      </motion.button>
    </div>
  );
};

export default FeedbackWidget;
