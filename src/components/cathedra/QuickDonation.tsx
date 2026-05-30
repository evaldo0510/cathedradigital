import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Icons } from '@/constants';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const DONATION_PRESETS = [5, 10, 20, 50];

const QuickDonation: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDonate = async () => {
    if (!amount || amount < 1) {
      toast.error('O valor mínimo é R$ 1,00');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar logado para doar.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-preference', {
        body: { 
          planId: 'donation', 
          price: amount, 
          title: 'Doação voluntária – Cathedra Digital', 
          origin: window.location.origin,
          isDonation: true
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        throw new Error('Link de pagamento não gerado.');
      }
    } catch (err) {
      console.error('Donation error:', err);
      toast.error('Erro ao processar doação. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <Card className="border-secondary/10 bg-secondary/[0.01] overflow-hidden transition-all hover:border-secondary/20 shadow-premium rounded-[2.5rem]">
      <CardHeader className="p-md pb-xs flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-sm">
          <div className="w-xl h-xl rounded-full bg-secondary/10 flex items-center justify-center text-secondary/60 transition-transform group-hover:scale-105">
            <Icons.Heart className="w-md h-md fill-current" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Apoie o Cathedra</CardTitle>
            <CardDescription className="text-premium-tiny">Ajude a manter nossa missão</CardDescription>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-xl w-xl p-0 rounded-full focus-visible:ring-2 focus-visible:ring-secondary outline-none"
          aria-label={isExpanded ? "Recolher doação rápida" : "Expandir doação rápida"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <Icons.ChevronUp className="w-md h-md" /> : <Icons.ChevronDown className="w-md h-md" />}
        </Button>

      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="p-md pt-0 space-y-4">
              <div className="grid grid-cols-4 gap-xs" role="group" aria-label="Valores sugeridos para doação">
                {DONATION_PRESETS.map((val) => (
                  <Button
                    key={val}
                    variant={amount === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(val)}
                    aria-pressed={amount === val}
                    className={`text-premium-tiny font-bold h-xl focus-visible:ring-2 focus-visible:ring-secondary outline-none ${amount === val ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : 'border-secondary/30 text-secondary'}`}
                  >
                    R$ {val}
                  </Button>
                ))}
              </div>

              
              <div className="flex gap-xs items-center">
                <span className="text-premium-tiny font-bold text-muted-foreground whitespace-nowrap">Outro:</span>
                <div className="relative flex-1">
                  <span className="absolute left-sm top-2xs/2 -translate-y-1/2 text-premium-tiny font-bold text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    min={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0,00"
                    className="h-xl pl-xl text-premium-tiny font-bold bg-background border-secondary/10 rounded-full focus:ring-1 focus:ring-secondary/20"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-md pt-0">
              <Button
                onClick={handleDonate}
                disabled={loading || !amount}
                className="btn-premium-secondary w-full h-2xl rounded-full text-premium-tiny font-black uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-premium shadow-secondary/20 transition-all"
              >
                {loading ? 'Processando...' : `Doar agora ${amount ? `R$ ${amount}` : ''}`}
              </Button>
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default QuickDonation;