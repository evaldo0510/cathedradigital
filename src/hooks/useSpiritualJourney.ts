import { useMemo } from 'react';
import { useReadingMarks } from './useReadingMarks';
import { useAuth } from './useAuth';

export interface DailyStep {
  icon: string;
  label: string;
  category: string;
  href: string;
  description?: string;
  completed?: boolean;
}

export function useSpiritualJourney() {
  const { marks, loading } = useReadingMarks();
  const { profile } = useAuth();

  const lastRead = useMemo(() => {
    return marks.find(m => m.is_last_read) || marks[0];
  }, [marks]);

  const dailySteps = useMemo<DailyStep[]>(() => {
    // In a real implementation, these would come from the Nexus Intelligence engine
    // linking the liturgy of the day with the user's history.
    return [
      {
        category: 'Liturgia',
        icon: '📖',
        label: 'Evangelho do Dia',
        href: '/liturgia',
        description: 'A Palavra que ilumina o caminho.'
      },
      {
        category: 'Oração',
        icon: '🙏',
        label: 'Oração da Manhã',
        href: '/oracao/manha',
        description: 'Consagração do dia ao Senhor.'
      },
      {
        category: 'Santoral',
        icon: '👤',
        label: 'Santo do Dia',
        href: '/santos',
        description: 'Um modelo de vida para hoje.'
      },
      {
        category: 'Doutrina',
        icon: '🏛',
        label: 'Catecismo §142',
        href: '/catechism?p=142',
        description: 'Relacionado à liturgia de hoje.'
      }
    ];
  }, []);

  return {
    lastRead,
    dailySteps,
    profile,
    loading
  };
}
