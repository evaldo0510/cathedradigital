import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CIC_SECTIONS } from '@/data/catechism';

interface SectionProgressProps {
  allProgress: Set<number> | undefined;
}

const SectionProgress: React.FC<SectionProgressProps> = ({ allProgress }) => {
  const calculateSectionProgress = (start: number, end: number) => {
    if (!allProgress) return 0;
    let count = 0;
    for (let i = start; i <= end; i++) {
      if (allProgress.has(i)) count++;
    }
    return Math.round((count / (end - start + 1)) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CIC_SECTIONS.flatMap(part => 
        part.sections.map(section => {
          const [start, end] = section.paragraphs;
          const progress = calculateSectionProgress(start, end);
          return (
            <Card key={section.id} className="p-4 space-y-3 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                    {part.part} • {part.title}
                  </div>
                  <h3 className="text-sm font-bold truncate leading-tight">{section.title}</h3>
                  <div className="text-[10px] text-muted-foreground mt-1">§{start} — §{end}</div>
                </div>
                <div className="text-sm font-black text-primary">{progress}%</div>
              </div>
              <Progress value={progress} className="h-1.5" />
            </Card>
          );
        })
      )}
    </div>
  );
};

export default SectionProgress;
