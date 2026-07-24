import { useState } from 'react';
import { Download, ImageIcon } from 'lucide-react';
import zipAsset from '@/assets/campaign/cathedra-instagram-ondas.zip.asset.json';


interface ArtItem {
  file: string;
  title: string;
  category: 'contemplativo' | 'formativo' | 'reel' | 'story' | 'template' | 'carrossel';
  format: '1:1' | '9:16';
  attribution?: string;
}

const ARTS: ArtItem[] = [
  // Onda 1
  { file: '01-contemplativo-agostinho.png', title: 'Inquietum est cor nostrum', category: 'contemplativo', format: '1:1', attribution: 'Santo Agostinho · Confissões I, 1' },
  { file: '02-contemplativo-teresa.png', title: 'Nada te turbe', category: 'contemplativo', format: '1:1', attribution: 'Santa Teresa de Ávila' },
  { file: '03-formativo-capa-graca.png', title: '3 tipos de graça', category: 'formativo', format: '1:1', attribution: 'Carrossel C02' },
  { file: '04-reel-capa-purgatorio.png', title: 'Purgatório é misericórdia', category: 'reel', format: '1:1', attribution: 'Reel R02' },
  // Onda 2
  { file: '05-contemplativo-tomas.png', title: 'Verum, bonum, pulchrum', category: 'contemplativo', format: '1:1', attribution: 'São Tomás de Aquino · Summa Theologiae' },
  { file: '06-contemplativo-chesterton.png', title: 'A fé é razão que se ajoelhou', category: 'contemplativo', format: '1:1', attribution: 'G. K. Chesterton · Ortodoxia' },
  { file: '07-contemplativo-ratzinger.png', title: 'No princípio era o Logos', category: 'contemplativo', format: '1:1', attribution: 'Bento XVI · Deus Caritas Est' },
  { file: '08-contemplativo-bento.png', title: 'Ora et labora', category: 'contemplativo', format: '1:1', attribution: 'São Bento · Regra, cap. XLVIII' },
  { file: '09-contemplativo-teresinha2.png', title: 'Tudo é graça', category: 'contemplativo', format: '1:1', attribution: 'Santa Teresinha · Manuscrito C' },
  { file: '10-contemplativo-joao-da-cruz.png', title: 'Na noite mais escura', category: 'contemplativo', format: '1:1', attribution: 'São João da Cruz · Subida do Monte Carmelo' },
  { file: '11-versiculo-joao-1-1.png', title: 'No princípio era o Verbo', category: 'contemplativo', format: '1:1', attribution: 'Jo 1, 1' },
  { file: '12-versiculo-salmo-23.png', title: 'O Senhor é meu pastor', category: 'contemplativo', format: '1:1', attribution: 'Salmo 23, 1-2' },
  // Stories
  { file: 'stories/01-story-agostinho.png', title: 'Agostinho — Story', category: 'story', format: '9:16' },
  { file: 'stories/02-story-teresa.png', title: 'Teresa de Ávila — Story', category: 'story', format: '9:16' },
  { file: 'stories/05-story-tomas.png', title: 'Tomás de Aquino — Story', category: 'story', format: '9:16' },
  { file: 'stories/06-story-chesterton.png', title: 'Chesterton — Story', category: 'story', format: '9:16' },
  { file: 'stories/07-story-ratzinger.png', title: 'Bento XVI — Story', category: 'story', format: '9:16' },
  { file: 'stories/08-story-bento.png', title: 'São Bento — Story', category: 'story', format: '9:16' },
  { file: 'stories/09-story-teresinha.png', title: 'Teresinha — Story', category: 'story', format: '9:16' },
  { file: 'stories/10-story-joao-da-cruz.png', title: 'João da Cruz — Story', category: 'story', format: '9:16' },
  { file: 'stories/11-story-joao-1-1.png', title: 'Jo 1,1 — Story', category: 'story', format: '9:16' },
  { file: 'stories/12-story-salmo-23.png', title: 'Salmo 23 — Story', category: 'story', format: '9:16' },
  // Carrosséis (capas)
  { file: 'carrossel/C01-capa-nexus.png', title: 'C01 · Nexus Theologicus', category: 'carrossel', format: '1:1' },
  { file: 'carrossel/C02-capa-graca.png', title: 'C02 · 3 tipos de graça', category: 'carrossel', format: '1:1' },
  { file: 'carrossel/C03-capa-catecismo.png', title: 'C03 · Ler o Catecismo', category: 'carrossel', format: '1:1' },
  { file: 'carrossel/C04-capa-marcas.png', title: 'C04 · 4 Marcas da Igreja', category: 'carrossel', format: '1:1' },
  { file: 'carrossel/C05-capa-rosario.png', title: 'C05 · Rosário', category: 'carrossel', format: '1:1' },
  { file: 'carrossel/C06-capa-missa.png', title: 'C06 · A Missa', category: 'carrossel', format: '1:1' },
  // Templates
  { file: 'templates/T1-contemplativo-base.png', title: 'Template · Contemplativo', category: 'template', format: '1:1' },
  { file: 'templates/T2-carrossel-capa-base.png', title: 'Template · Carrossel', category: 'template', format: '1:1' },
  { file: 'templates/T3-reel-capa-base.png', title: 'Template · Reel', category: 'template', format: '1:1' },
  { file: 'templates/T4-story-carrossel-base.png', title: 'Template · Story Carrossel', category: 'template', format: '9:16' },
  { file: 'templates/T5-story-reel-base.png', title: 'Template · Story Reel', category: 'template', format: '9:16' },
];

const CATEGORIES: Array<{ id: ArtItem['category'] | 'all'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'contemplativo', label: 'Contemplativos' },
  { id: 'story', label: 'Stories 9:16' },
  { id: 'carrossel', label: 'Carrosséis' },
  { id: 'formativo', label: 'Formativos' },
  { id: 'reel', label: 'Reels' },
  { id: 'template', label: 'Templates' },
];

const BASE = '/campaign';

export default function InstagramGalleryPage() {
  const [filter, setFilter] = useState<ArtItem['category'] | 'all'>('all');
  const filtered = filter === 'all' ? ARTS : ARTS.filter(a => a.category === filter);

  return (
    <div className="min-h-screen bg-[#f5f0e0] text-[#0B1F3A] p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a84c] mb-2">Cathedra · Instagram</p>
        <h1 className="text-4xl font-serif mb-2">Galeria de Artes da Campanha</h1>
        <p className="text-sm opacity-70">
          Todas as artes geradas para as ondas 1-3. Clique em uma peça para baixar em resolução completa.
        </p>
        <a
          href={zipAsset.url}
          className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full bg-[#0B1F3A] text-[#f5f0e0] text-sm hover:opacity-90"

          download
        >
          <Download className="w-4 h-4" aria-hidden />
          Baixar ZIP completo
        </a>
      </header>

      <nav className="max-w-6xl mx-auto flex flex-wrap gap-2 mb-8" aria-label="Filtros">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              filter === c.id
                ? 'bg-[#0B1F3A] text-[#f5f0e0] border-[#0B1F3A]'
                : 'bg-transparent text-[#0B1F3A] border-[#0B1F3A]/30 hover:border-[#0B1F3A]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <ul className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(art => (
          <li key={art.file} className="group bg-white/50 border border-[#c9a84c]/30 rounded-2xl overflow-hidden">
            <div className={`relative bg-[#0B1F3A]/5 ${art.format === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
              <img
                src={`${BASE}/${art.file}`}
                alt={art.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (sib) sib.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 hidden items-center justify-center text-xs opacity-40 flex-col gap-2">
                <ImageIcon className="w-6 h-6" aria-hidden />
                <span>Pendente</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs uppercase tracking-widest text-[#c9a84c] mb-1">{art.format} · {art.category}</p>
              <h2 className="font-serif text-base leading-tight mb-1">{art.title}</h2>
              {art.attribution && (
                <p className="text-xs opacity-60 mb-3">{art.attribution}</p>
              )}
              <a
                href={`${BASE}/${art.file}`}
                download
                className="inline-flex items-center gap-1 text-xs text-[#0B1F3A] underline hover:no-underline"
              >
                <Download className="w-3 h-3" aria-hidden /> Baixar
              </a>
            </div>
          </li>
        ))}
      </ul>

      <footer className="max-w-6xl mx-auto mt-12 text-xs opacity-60">
        {filtered.length} peça(s) exibida(s) · Cathedra Digital · Uso interno editorial
      </footer>
    </div>
  );
}
