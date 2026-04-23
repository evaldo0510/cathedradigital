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
    <div className="fixed bottom-24 right-6 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full shadow-2xl hover:scale-105 transition-all border border-white/20"
      >
        <Icons.Activity className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Dev Inspector</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-14 right-0 w-80 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Icons.Activity className="w-3 h-3" />
                Dados em Tempo Real
              </h4>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Icons.X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-2">
                {fields.map((field) => {
                  const status = getStatus(field.name.toLowerCase(), field.value);
                  return (
                    <div key={field.name} className="flex flex-col gap-1 p-2 rounded-xl bg-muted/20 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{field.name}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono truncate text-foreground/80">
                        {String(field.value || 'N/A')}
                      </div>
                      <div className="text-[8px] italic text-muted-foreground/60">
                        Fonte: {field.source}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">JSON Bruto (Official Saint)</p>
                <pre className="text-[10px] bg-black/5 p-3 rounded-xl overflow-x-auto font-mono text-foreground/70">
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