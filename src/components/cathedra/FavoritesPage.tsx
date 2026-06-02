import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Icons } from '../../constants';
import { useFavorites } from '@/hooks/useFavorites';

const FavoritesPage: React.FC = () => {
  const { favorites, removeFavorite } = useFavorites();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? favorites : favorites.filter(f => f.type === filter);

  const types = ['all', ...Array.from(new Set(favorites.map(f => f.type)))];
  const typeLabels: Record<string, string> = { all: 'Todos', verse: 'Versículos', catechism: 'Catecismo', prayer: 'Orações', study: 'Estudos', dogma: 'Dogmas' };

  return (
    <div className="w-full space-y-spacing-xl">
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.Heart className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Biblioteca Pessoal</span>
        </div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground">Favoritos</h1>
        <p className="text-muted-foreground font-serif italic">Seus versículos, orações e estudos salvos.</p>
      </div>

      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-spacing-xs justify-center">
          {types.map(t => (
            <Button key={t} onClick={() => setFilter(t)}
              className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-bold transition-all ${t === filter ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground hover:bg-primary/5'}`}>
              {typeLabels[t] || t}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-spacing-md text-center">
          <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-muted flex items-center justify-center">
            <Icons.Heart className="w-spacing-xl h-spacing-xl text-muted-foreground" />
          </div>
          <h3 className="text-premium-xl font-serif font-bold text-foreground">Nenhum favorito ainda</h3>
          <p className="text-muted-foreground font-serif italic">
            Ao navegar pela Bíblia, Catecismo e orações, toque no ícone de coração para salvar seus conteúdos favoritos aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-spacing-sm">
          {filtered.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-premium p-spacing-md group hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-spacing-md">
                <div className="space-y-spacing-2xs flex-1">
                  <div className="flex items-center gap-spacing-xs">
                    <span className="text-premium-xs font-black uppercase tracking-widest text-primary">{typeLabels[item.type] || item.type}</span>
                    <span className="text-premium-xs text-muted-foreground">{new Date(item.timestamp).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h3 className="font-serif font-bold text-foreground">{item.title}</h3>
                  <p className="text-premium-sm text-muted-foreground font-serif line-clamp-spacing-xs">{item.content}</p>
                </div>
                <Button onClick={() => removeFavorite(item.id)} className="p-spacing-xs rounded-premium-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                  <Icons.Cross className="w-spacing-md h-spacing-md text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
