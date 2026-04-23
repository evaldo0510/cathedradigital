import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FaithTerm } from '@/components/cathedra/AZFaithPage';

export const useGlossary = () => {
  return useQuery({
    queryKey: ['glossary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary')
        .select('*')
        .order('term', { ascending: true });

      if (error) throw error;

      return data.map(item => ({
        term: item.term,
        definition: item.definition || '',
        category: item.category || 'Conceito',
        reference: item.reference || undefined,
        deepInterpretation: item.deep_interpretation || undefined,
        practicalApplication: item.practical_application || undefined,
        bibleVerses: item.bible_verses || undefined,
        catechismReferences: item.catechism_references || undefined,
        magisteriumReferences: item.magisterium_references || undefined,
        journey_id: item.journey_id || undefined,
      })) as FaithTerm[];
    },
  });
};
