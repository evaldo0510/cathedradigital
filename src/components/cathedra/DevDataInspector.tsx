import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '@/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface DevDataInspectorProps {
  data: {
    officialSaint?: any;
    allSaintsToday?: any[];
    activeJourney?: any;
    profile?: any;
  };
}

const DevDataInspector: React.FC<DevDataInspectorProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { officialSaint, allSaintsToday } = data;

  const getStatus = (field: string, value: any) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return { label: 'Vazio', color: 'text-rose-500 bg-rose-500/10' };
    }
    if (field === 'name' && value === 'Santo do Dia') {
      return { label: 'Inconsistente (Fallback)', color: 'text-amber-500 bg-amber-500/10' };
    }
    return { label: 'OK', color: 'text-emerald-500 bg-emerald-500/10' };
  };

  const fields = [
    { name: 'Nome', value: officialSaint?.name, source: 'Edge Function' },
    { name: 'Data', value: officialSaint?.date || new Date().toISOString().split('T')[0], source: 'Edge Function' },
    { name: 'Imagem', value: officialSaint?.image, source: 'Edge Function' },
    { name: 'Bio', value: officialSaint?.description || officialSaint?.fullBio, source: 'Edge Function' },
    { name: 'Santos DB', value: allSaintsToday?.length, source: 'Supabase DB' },
  ];

  return (
    <div className="fixed bottom-spacing-4xl right-spacing-lg z-[9999]">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-spacing-xs px-spacing-md py-spacing-xs bg-primary text-white rounded-full shadow-premium-hover hover:scale-105 transition-all border border-white/20"
      >
        <Icons.Activity className="w-spacing-md h-spacing-md" />
        <span className="text-xs font-black uppercase tracking-widest">Dev Inspector</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-spacing-2xl right-0 w-spacing-4xl bg-card border border-border rounded-premium shadow-premium-hover overflow-hidden "
          >
            <div className="p-spacing-md border-b border-border bg-muted/30 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-spacing-xs">
                <Icons.Activity className="w-spacing-sm h-spacing-sm" />
                Dados em Tempo Real
              </h4>
              <Button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Icons.X className="w-spacing-md h-spacing-md" />
              </Button>
            </div>
            
            <div className="p-spacing-md space-y-spacing-md max-h-[400px] overflow-y-auto">
              <div className="space-y-spacing-xs">
                {fields.map((field) => {
                  const status = getStatus(field.name.toLowerCase(), field.value);
                  return (
                    <div key={field.name} className="flex flex-col gap-spacing-2xs p-spacing-xs rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{field.name}</span>
                        <span className={`text-xs font-black uppercase px-spacing-2xs py-spacing-3xs rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-premium-small font-mono truncate text-foreground/80">
                        {String(field.value || 'N/A')}
                      </div>
                      <div className="text-xs italic text-muted-foreground/60">
                        Fonte: {field.source}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-spacing-xs">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-spacing-xs">JSON Bruto (Official Saint)</p>
                <pre className="text-xs bg-black/5 p-spacing-sm rounded-lg overflow-x-auto font-mono text-foreground/70">
                  {JSON.stringify(officialSaint, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevDataInspector;