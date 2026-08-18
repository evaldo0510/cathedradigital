import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icons } from '@/constants';
import SacredImage from './SacredImage';
import { ReaderShell, EditorialHero, NexusPanel, ReaderContinuation, ReaderToolbar } from '@/components/reader';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

// Mock ou busca de dados do Papa (em produção viria do serviço)
const GET_POPE_BY_ID = (id: string) => ({
  id,
  name: id === 'peter' ? 'São Pedro' : 'Bento XVI',
  title: id === 'peter' ? 'O Primeiro Papa' : 'O Papa da Razão',
  image: 'https://images.unsplash.com/photo-1548625361-195feee1c4ce?q=80&w=2000&auto=format&fit=crop',
  bio: 'Biografia detalhada do Santo Padre...',
  category: 'papa'
});

const PopeDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const pope = GET_POPE_BY_ID(id || 'peter');

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Desktop Sidebar: Sacred Visuals */}
      <div className="hidden md:flex md:w-[40%] sticky top-0 h-screen overflow-hidden bg-primary/5 border-r border-primary/5">
        <SacredImage 
          src={pope.image} 
          className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
          alt={pope.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-spacing-xl text-center space-y-spacing-lg">
           <div className="w-spacing-4xl h-spacing-4xl mx-auto rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-premium">
             <Icons.Church className="w-spacing-xl h-spacing-xl text-secondary" />
           </div>
           <div className="space-y-spacing-xs">
             <h2 className="font-display text-4xl text-primary/40 tracking-widest uppercase italic">{pope.name}</h2>
             <p className="text-[10px] uppercase tracking-[0.4em] text-secondary/60 font-bold">{pope.title}</p>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ReaderToolbar
          kicker="Sucessor de Pedro · Papa"
          title={pope.name}
          subtitle={pope.title}
          backHref="/papas"
        />
        
        <ReaderShell
          ariaLabel={pope.name}
          nexus={<NexusPanel output={{ selfId: pope.id, suggestions: [] } as any} />}
          continuation={
            <ReaderContinuation
              currentTitle={pope.name}
              currentSlug={`/papas/${pope.id}`}
              nextTitle="Próximo Papa"
              nextSlug="/papas"
            />
          }
        >
          <div className="p-spacing-lg md:p-spacing-2xl space-y-spacing-2xl">
            <EditorialHero 
              title={pope.name}
              subtitle={pope.title}
              align="left"
            />
            <article className="prose prose-stone max-w-none">
              <p className="font-reader text-lg leading-relaxed text-foreground/90">
                {pope.bio}
              </p>
            </article>
          </div>
        </ReaderShell>
      </div>
    </div>
  );
};

export default PopeDetailPage;