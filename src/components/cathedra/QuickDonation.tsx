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
    <Card className="border-secondary/20 bg-secondary/5 overflow-hidden transition-all hover:border-secondary/40">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
            <Icons.Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Apoie o Cathedra</CardTitle>
            <CardDescription className="text-[10px]">Ajude a manter nossa missão</CardDescription>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0 rounded-full"
        >
          {isExpanded ? <Icons.ChevronUp className="w-4 h-4" /> : <Icons.ChevronDown className="w-4 h-4" />}
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
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {DONATION_PRESETS.map((val) => (
                  <Button
                    key={val}
                    variant={amount === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(val)}
                    className={`text-[10px] font-bold h-8 ${amount === val ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : 'border-secondary/30 text-secondary'}`}
                  >
                    R$ {val}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Outro:</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    min={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0,00"
                    className="h-8 pl-8 text-[10px] font-bold bg-background border-secondary/20"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                onClick={handleDonate}
                disabled={loading || !amount}
                className="w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20 transition-all"
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