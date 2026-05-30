import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATECHISM_LOCAL_DATA } from '@/data/catechism';
import { Icons } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { isCatechism } from '@/lib/catechismValidation';

const ITEMS_PER_PAGE = 10;

const CatechismExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Persistence State
  const searchQuery = searchParams.get('q') || '';
  const selectedTags = useMemo(() => searchParams.get('tags')?.split(',').filter(Boolean) || [], [searchParams]);
  const currentPage = parseInt(searchParams.get('page') || '1');
  const sortBy = (searchParams.get('sort') as 'number-asc' | 'number-desc') || 'number-asc';

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    setSearchParams(params);
  };

  const allParagraphs = useMemo(() => Object.values(CATECHISM_LOCAL_DATA), []);

  // Global Tag Counts (for the sidebar)
  const globalTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allParagraphs.forEach(p => {
      p.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allParagraphs]);

  // Filter and sort
  const filteredParagraphs = useMemo(() => {
    const result = allParagraphs.filter(p => {
      // Security/Validation check: must be catechism type
      if (!isCatechism(p)) return false;

      const matchesSearch = 
        p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.conteudo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paragraph.toString().includes(searchQuery);
      
      const matchesTags = 
        selectedTags.length === 0 || 
        selectedTags.every(tag => p.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });

    result.sort((a, b) => {
      if (sortBy === 'number-asc') return a.paragraph - b.paragraph;
      return b.paragraph - a.paragraph;
    });

    return result;
  }, [allParagraphs, searchQuery, selectedTags, sortBy]);

  // Dynamic Tag Counts (matches within current filtered set)
  const dynamicTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredParagraphs.forEach(p => {
      p.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [filteredParagraphs]);

  // Pagination
  const totalPages = Math.ceil(filteredParagraphs.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredParagraphs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredParagraphs, currentPage]);

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag) 
      : [...selectedTags, tag];
    
    updateParams({ 
      tags: nextTags.length > 0 ? nextTags.join(',') : null,
      page: '1'
    });
  };

  const handleSearchChange = (val: string) => {
    updateParams({ q: val || null, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const toggleSort = () => {
    updateParams({ sort: sortBy === 'number-asc' ? 'number-desc' : 'number-asc' });
  };

  const clearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-spacing-4xl mx-auto p-spacing-md md:p-spacing-xl space-y-spacing-md md:space-y-spacing-xl min-h-screen pb-spacing-3xl">
      <SEOHead 
        title="Explorador do Catecismo | Cathedra" 
        description="Navegue pelos parágrafos do Catecismo da Igreja Católica com filtros inteligentes e temas."
        path="/catechism/explorer"
      />

      <div className="flex flex-col gap-spacing-xs">
        <h1 className="font-serif font-bold text-foreground">Explorador do Catecismo</h1>
        <p className="text-muted-foreground">Conteúdo dogmático local e sempre disponível.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-spacing-xl">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-spacing-lg">
          <div className="p-spacing-md bg-muted/30 rounded-premium border border-border/50 space-y-spacing-xs">
            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
              <span>Total Geral</span>
              <span className="text-foreground">{allParagraphs.length}</span>
            </div>
            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-primary">
              <span>Filtrados</span>
              <span className="font-black">{filteredParagraphs.length}</span>
            </div>
          </div>

          <div className="space-y-spacing-md">
            <div className="flex items-center gap-spacing-xs text-primary font-bold uppercase text-xs tracking-widest">
              <Icons.Search className="w-spacing-sm h-spacing-sm" /> Busca Rápida
            </div>
            <Input 
              placeholder="Ex: §142, fé, pecado..." 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-card border-border/50"
            />
          </div>

          <div className="space-y-spacing-md">
            <div className="flex items-center gap-spacing-xs text-primary font-bold uppercase text-xs tracking-widest">
              <Icons.Tag className="w-spacing-sm h-spacing-sm" /> Temas e Tags
            </div>
            <ScrollArea className="h-[400px] pr-spacing-md">
              <div className="flex flex-wrap gap-spacing-xs">
                {globalTagCounts.map(([tag, totalCount]) => {
                  const currentCount = dynamicTagCounts[tag] || 0;
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      disabled={currentCount === 0 && !isSelected}
                      className={`group flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs rounded-full text-premium-small transition-all border ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : currentCount === 0 
                            ? 'opacity-40 cursor-not-allowed bg-muted/20 border-transparent text-muted-foreground'
                            : 'bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{tag}</span>
                      <div className="flex items-center gap-spacing-2xs">
                        <Badge variant="secondary" className={`px-spacing-2xs h-spacing-sm min-w-[14px] flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : ''}`}>
                          {currentCount}
                        </Badge>
                        {!isSelected && currentCount !== totalCount && (
                          <span className="text-xs opacity-40">/ {totalCount}</span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-spacing-lg">
          <div className="flex items-center justify-between gap-spacing-md">
            <div className="text-premium-small font-medium text-muted-foreground">
              {filteredParagraphs.length} resultados encontrados
            </div>
            <div className="flex items-center gap-spacing-xs">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSort}
                className="text-xs font-black uppercase tracking-widest h-spacing-xl"
              >
                <Icons.ArrowDown className={`w-spacing-sm h-spacing-sm mr-spacing-xs transition-transform ${sortBy === 'number-desc' ? 'rotate-180' : ''}`} />
                {sortBy === 'number-asc' ? 'Crescente' : 'Decrescente'}
              </Button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="space-y-spacing-md">
              {paginatedItems.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className="p-spacing-md md:p-spacing-lg cursor-pointer hover:border-primary/20 transition-all group bg-background/50 backdrop-blur-sm"
                    onClick={() => navigate(`/catechism?p=${p.paragraph}`)}
                  >
                    <div className="flex gap-spacing-md">
                      <div className="text-base font-serif font-bold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                        §{p.paragraph}
                      </div>
                      <div className="flex-1 space-y-spacing-xs">
                        <h3 className="font-serif font-bold text-foreground">{p.titulo}</h3>
                        <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                          {p.conteudo}
                        </p>
                        <div className="flex flex-wrap gap-spacing-xs pt-spacing-xs">
                          {p.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-bold uppercase tracking-wider bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Icons.ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground group-hover:text-primary transition-all self-center" />
                    </div>
                  </Card>
                </motion.div>
              ))}

              {filteredParagraphs.length === 0 && (
                <div className="text-center py-spacing-3xl bg-muted/20 rounded-premium border-2 border-dashed border-border">
                  <Icons.Search className="w-spacing-2xl h-spacing-2xl text-muted-foreground mx-auto mb-spacing-md opacity-20" />
                  <h3 className="font-bold">Nenhum parágrafo encontrado</h3>
                  <p className="text-muted-foreground">Tente ajustar seus filtros ou busca.</p>
                  <Button variant="link" onClick={clearAll} className="mt-spacing-xs">
                    Limpar tudo
                  </Button>
                </div>
              )}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-spacing-xs pt-spacing-xl">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <div className="text-premium-small font-bold px-spacing-md">
                Página {currentPage} de {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatechismExplorer;
