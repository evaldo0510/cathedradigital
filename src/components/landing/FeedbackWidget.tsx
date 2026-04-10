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
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[320px] bg-card border border-border shadow-2xl rounded-3xl p-6 overflow-hidden"
          >
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold">Obrigado!</h3>
                <p className="text-sm text-muted-foreground font-serif italic">
                  Seu feedback é precioso para construirmos o Cathedra juntos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg">Deixe seu feedback</h3>
                  <button type="button" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-xs text-muted-foreground font-serif italic mb-4">
                  Como podemos tornar o Cathedra mais acolhedor para você?
                </p>

                <div className="flex gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all ${rating >= star ? 'text-secondary scale-110' : 'text-muted-foreground/30'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="O que você achou do projeto? O que falta para você começar a usar?"
                  className="w-full h-32 px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-serif"
                />

                <Button 
                  type="submit" 
                  disabled={isSubmitting || (!feedback && rating === 0)}
                  className="w-full rounded-2xl font-black uppercase tracking-widest text-[10px] h-12"
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
        className="flex items-center justify-center gap-2 p-3 lg:px-5 lg:py-3 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-[10px] min-w-0"
      >
        <MessageSquare className="w-4 h-4 shrink-0" />
        <span className="hidden lg:inline">{isOpen ? 'Fechar' : 'Feedback'}</span>
      </motion.button>
    </div>
  );
};

export default FeedbackWidget;
