import React from 'react';
import { useSearchParams } from 'react-router-dom';
import TheologicalText from '@/components/cathedra/TheologicalText';

/**
 * Página fixture restrita a ambientes não-produção para validação E2E
 * do TheologicalText (popovers do catecismo/bíblia) com texto controlado.
 */
const TheologicalTextFixture: React.FC = () => {
  const [params] = useSearchParams();
  const text = params.get('text') ?? '';

  if (import.meta.env.PROD) {
    return <div>Not available</div>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>TheologicalText Fixture</h1>
      <div data-testid="theological-text-output">
        <TheologicalText text={text} />
      </div>
    </main>
  );
};

export default TheologicalTextFixture;
