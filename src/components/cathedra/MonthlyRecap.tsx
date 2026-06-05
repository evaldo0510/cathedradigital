import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MonthlyRecapProps {
  onClose: () => void;
  onSelectDate: (bookAbbr: string, chapter: number) => void;
}

export const MonthlyRecap: React.FC<MonthlyRecapProps> = ({ onClose, onSelectDate }) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dailyStatus = localStorage.getItem(`cathedra_bible_daily_${dateStr}`);
    
    // In a real app, you'd fetch what the reading was for that day
    // For this simulation, we'll use a placeholder or deterministic mock
    return {
      date,
      dateStr,
      isCompleted: dailyStatus === 'completed',
      // Mock data for the specific reading of that day
      reading: { bookAbbr: 'Mt', bookName: 'Mateus', chapter: (i % 28) + 1 }
    };
  });

  const filteredDays = days.filter(day => {
    if (filter === 'completed') return day.isCompleted;
    if (filter === 'pending') return !day.isCompleted;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF9F6] flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-0">
        <button onClick={onClose} className="p-2 -ml-2 text-primary/40 active:text-secondary">
          <Icons.X className="w-6 h-6" />
        </button>
        <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80">Recapitulação Mensal</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 py-4 flex gap-2 border-b border-primary/5 bg-white/30 overflow-x-auto no-scrollbar">
        {(['all', 'completed', 'pending'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              filter === f 
                ? "bg-secondary text-white shadow-sm" 
                : "bg-primary/5 text-primary/40"
            )}
          >
            {f === 'all' && 'Todas'}
            {f === 'completed' && 'Concluídas'}
            {f === 'pending' && 'Pendentes'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <div className="space-y-4">
          {filteredDays.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => onSelectDate(day.reading.bookAbbr, day.reading.chapter)}
              className="w-full flex items-center justify-between p-4 bg-white border border-primary/5 rounded-2xl shadow-sm active:scale-[0.98] transition-all text-left"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/20 block">
                  {day.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </span>
                <span className="font-serif font-bold text-base text-primary/80">
                  {day.reading.bookName} {day.reading.chapter}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {day.isCompleted ? (
                  <Icons.CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-primary/5" />
                )}
                <Icons.ChevronRight className="w-4 h-4 text-primary/10" />
              </div>
            </button>
          ))}
          
          {filteredDays.length === 0 && (
            <div className="py-20 text-center opacity-20">
              <Icons.Calendar className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-black uppercase tracking-widest italic">Nenhuma leitura encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
