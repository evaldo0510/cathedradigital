import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';
import { Heart, PenLine, Share2, Link2, Sparkles } from 'lucide-react';

const BASE = '/prototype-2.0';

interface Passage {
  header: string;
  crumb: string;
  chapter?: string;
  verses: Array<{ n: number; text: string; anchor?: boolean }>;
  prev?: { label: string; ref: string };
  next?: { label: string; ref: string };
  nexus: string[];
}

const CATALOGO: Record<string, Passage> = {
  jo15: {
    header: 'João 15',
    crumb: 'Jo · NVI-PT',
    chapter: '15',
    verses: [
      { n: 1, text: 'Eu sou a videira verdadeira, e meu Pai é o agricultor.', anchor: true },
      { n: 2, text: 'Todo ramo que, estando em mim, não dá fruto, ele corta; e todo o que dá fruto limpa, para que produza mais fruto ainda.', anchor: true },
      { n: 3, text: 'Vós já estais limpos, pela palavra que vos tenho anunciado.' },
      { n: 4, text: 'Permanecei em mim, e eu permanecerei em vós.' },
      { n: 5, text: 'Eu sou a videira, vós, os ramos. Quem permanece em mim, e eu, nele, esse dá muito fruto; porque sem mim nada podeis fazer.', anchor: true },
    ],
    prev: { label: 'Jo 14', ref: 'jo14' },
    next: { label: 'Jo 16', ref: 'jo16' },
    nexus: ['CIC §755-757', 'Lumen Gentium 6', 'ST III q.8', 'Cân. 204', 'Agostinho, Tract. 81'],
  },
  sl23: {
    header: 'Salmo 23',
    crumb: 'Sl · NVI-PT',
    chapter: '23',
    verses: [
      { n: 1, text: 'O Senhor é o meu pastor; nada me faltará.' },
      { n: 2, text: 'Em verdes pastos me faz repousar e me conduz a águas tranquilas.' },
      { n: 3, text: 'Restaura-me o vigor. Guia-me nas veredas da justiça por amor do seu nome.' },
    ],
    next: { label: 'Sl 24', ref: 'sl24' },
    nexus: ['CIC §754', 'Jo 10,11'],
  },
  cic1234: {
    header: 'Catecismo §1234',
    crumb: 'CIC · Parte II',
    verses: [
      { n: 1234, text: 'O sentido e a graça do sacramento do Batismo manifestam-se claramente nos ritos da sua celebração…', anchor: true },
    ],
    prev: { label: '§1233', ref: 'cic1233' },
    next: { label: '§1235', ref: 'cic1235' },
    nexus: ['Rm 6,3-4', 'Concílio de Trento · sessão VII'],
  },
  laudes: {
    header: 'Laudes',
    crumb: 'Ofício divino · sexta-feira',
    verses: [
      { n: 1, text: 'Vinde, exultemos ao Senhor, aclamemos o Deus que nos salva.' },
      { n: 2, text: 'Ao seu encontro caminhemos com louvores, e com cânticos de festa o celebremos.' },
    ],
    nexus: ['Sl 95', 'Sl 148'],
  },
};

const Leitor: React.FC = () => {
  const [params] = useSearchParams();
  const ref = params.get('ref') ?? 'jo15';
  const preceInitial = params.get('prece') === '1';
  const [prece, setPrece] = useState(preceInitial);
  const [nexusOn, setNexusOn] = useState(true);
  const [openNexus, setOpenNexus] = useState<number | null>(null);
  const [fav, setFav] = useState(false);

  const p = useMemo(() => CATALOGO[ref] ?? CATALOGO.jo15, [ref]);

  return (
    <PrototypeShell
      title={p.header}
      back={`${BASE}/estudar`}
      hideNav={prece}
      liturgicalColor={prece ? 'hsl(280 30% 30%)' : undefined}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>{p.crumb}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNexusOn((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded ${nexusOn ? 'text-primary' : 'text-muted-foreground'}`}
            title="Ligar/desligar Nexus"
          >
            <Link2 size={14} /> Nexus
          </button>
          <button
            onClick={() => setPrece((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded ${prece ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
          >
            <Sparkles size={14} /> {prece ? 'Sair da Prece' : 'Modo Prece'}
          </button>
        </div>
      </div>

      {p.chapter && (
        <div className="font-serif text-5xl text-primary/70 mb-4">{p.chapter}</div>
      )}

      <article className={`font-serif text-lg leading-relaxed space-y-3 ${prece ? 'text-foreground/90' : ''}`}>
        {p.verses.map((v) => (
          <p key={v.n}>
            <sup className="text-xs text-muted-foreground mr-1">{v.n}</sup>
            <span>{v.text}</span>
            {v.anchor && nexusOn && !prece && (
              <button
                onClick={() => setOpenNexus(openNexus === v.n ? null : v.n)}
                className="ml-1 text-primary text-sm align-super"
                aria-label="Abrir Nexus"
              >
                °
              </button>
            )}
            {openNexus === v.n && !prece && (
              <span className="block mt-2 border border-border rounded-md p-3 bg-muted/40 text-sm not-italic font-sans">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
                  Ver também
                </span>
                <ul className="space-y-1">
                  {p.nexus.map((n) => (
                    <li key={n}>
                      <Link
                        to={`${BASE}/pesquisar?q=${encodeURIComponent(n)}`}
                        className="text-primary hover:underline"
                      >
                        • {n}
                      </Link>
                    </li>
                  ))}
                </ul>
              </span>
            )}
          </p>
        ))}
      </article>

      {/* Barra contextual */}
      {!prece && (
        <div className="sticky bottom-16 -mx-4 mt-8 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex divide-x divide-border">
            <button
              onClick={() => setFav((v) => !v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm hover:bg-muted/40 ${fav ? 'text-primary' : ''}`}
            >
              <Heart size={14} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Favorito' : 'Favoritar'}
            </button>
            <Link to={`${BASE}/minha-jornada`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm hover:bg-muted/40">
              <PenLine size={14} /> Anotar
            </Link>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm hover:bg-muted/40">
              <Share2 size={14} /> Compartilhar
            </button>
          </div>
        </div>
      )}

      {/* Prev/Next */}
      {(p.prev || p.next) && !prece && (
        <div className="flex justify-between mt-4 text-sm">
          {p.prev ? (
            <Link to={`${BASE}/leitor?ref=${p.prev.ref}`} className="text-primary hover:underline">
              ◀ {p.prev.label}
            </Link>
          ) : <span />}
          {p.next && (
            <Link to={`${BASE}/leitor?ref=${p.next.ref}`} className="text-primary hover:underline">
              {p.next.label} ▶
            </Link>
          )}
        </div>
      )}

      {/* Logos flutuante */}
      {!prece && (
        <button
          className="fixed bottom-24 right-4 z-30 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          title="Logos IA — Explicar"
          aria-label="Abrir Logos"
        >
          <Sparkles size={18} />
        </button>
      )}

      {fav && !prece && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          ♥ Salvo em <Link to={`${BASE}/minha-jornada`} className="text-primary underline">Minha Jornada</Link>
        </p>
      )}
    </PrototypeShell>
  );
};

export default Leitor;
