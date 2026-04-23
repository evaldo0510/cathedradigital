import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FaithTerm } from '@/components/cathedra/AZFaithPage';

export const useGlossary = () => {
  return useQuery({
    queryKey: ['glossary'],
    queryFn: async () => {
      console.log('Fetching glossary from Supabase...');
      const { data, error } = await supabase
        .from('glossary')
        .select('*')
        .order('term', { ascending: true });

      if (error) {
        console.error('Error fetching glossary:', error);
        throw error;
      }

      console.log('Glossary fetched:', data?.length, 'terms');

      return (data || []).map(item => ({
        term: item.term,
        definition: item.definition || '',
        category: item.category || 'Conceito',
        reference: item.reference || undefined,
        deepInterpretation: item.deep_interpretation || undefined,
        practicalApplication: item.practical_application || undefined,
        bibleVerses: (item.bible_verses as string[]) || undefined,
        catechismReferences: (item.catechism_references as string[]) || undefined,
        magisteriumReferences: (item.magisterium_references as string[]) || undefined,
        journey_id: item.journey_id || undefined,
      })) as FaithTerm[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
