import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Icons } from '@/constants';
import SacredImage from './SacredImage';
import { ReaderShell, EditorialHero, NexusPanel, ReaderContinuation, ReaderToolbar } from '@/components/reader';
import { useLang } from '@/hooks/useLang';

// Mock ou busca de dados do Papa (em produção viria do serviço)
const GET_POPE_BY_ID = (id: string) => {
  const popes: Record<string, any> = {
    'peter': {
      id: 'peter',
      name: 'São Pedro',
      title: 'O Primeiro Papa',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/San_Pietro_di_Arnolfo_di_Cambio.jpg/440px-San_Pietro_di_Arnolfo_di_Cambio.jpg',
      bio: 'Pescador da Galileia, escolhido por Jesus como a rocha sobre a qual a Igreja seria construída. O Príncipe dos Apóstolos.',
      category: 'papa'
    },
    'benedict-xvi': {
      id: 'benedict-xvi',
      name: 'Bento XVI',
      title: 'O Papa da Razão',
      image: 'https://images.unsplash.com/photo-1548625361-195feee1c4ce?q=80&w=2000&auto=format&fit=crop',
      bio: 'Joseph Ratzinger, um dos maiores teólogos do século XX, serviu a Igreja com humildade e profundidade intelectual.',
      category: 'papa'
    }
  };
  return popes[id];
};

const PopeDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useLang();
  const pope = id ? GET_POPE_BY_ID(id) : null;

  if (!pope) {
    return <Navigate to="/papas" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-background">
      {/* Desktop Sidebar: Sacred Visuals (Synced with Mobile Nav Icons) */}
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
          hero={
            <EditorialHero 
              title={pope.name}
              subtitle={pope.title}
              align="left"
            />
          }
          nexus={<NexusPanel output={{ selfId: pope.id, suggestions: [] } as any} />}
          continuation={
            <ReaderContinuation
              context={{
                kind: 'magisterium',
                id: pope.id,
              }}
            />
          }
        >
          <div className="space-y-spacing-2xl">
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