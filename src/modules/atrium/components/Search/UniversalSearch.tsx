import React from 'react';
import { Search } from 'lucide-react';
import { useSearchSuggestions } from '../../hooks';

const UniversalSearch: React.FC = () => {
  const suggestions = useSearchSuggestions();

  return (
    <section data-atrium-block="P1" aria-labelledby="atrium-search">
      <h2 id="atrium-search" className="sr-only">Pesquisa Universal</h2>
      <div className="flex items-center gap-2 border border-border rounded-md px-3 py-3 bg-card">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="search"
          placeholder="O que você busca compreender?"
          className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted transition">
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UniversalSearch;
