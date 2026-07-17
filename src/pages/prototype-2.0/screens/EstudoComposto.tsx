import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';
import { Bookmark, PenLine, Share2 } from 'lucide-react';

const BASE = '/prototype-2.0';

const CONTEUDO: Record<string, { titulo: string; fontes: number; min: number; blocos: Array<{ n: number; fonte: string; ref: string; excerpt?: string; leitor?: string }> }> = {
  perdao: {
    titulo: 'Perdão',
    fontes: 6,
    min: 18,
    blocos: [
      { n: 1, fonte: 'Escritura', ref: 'Mt 18,21-35 · Lc 15', excerpt: '"Setenta vezes sete…"', leitor: 'mt18' },
      { n: 2, fonte: 'Catecismo', ref: '§§ 1422-1470', leitor: 'cic1422' },
      { n: 3, fonte: 'Magistério', ref: 'Misericordiae Vultus §§21-22', leitor: 'mv21' },
      { n: 4, fonte: 'Padres', ref: 'Agostinho · Sermão 83', leitor: 'aug83' },
      { n: 5, fonte: 'Concílio', ref: 'Trento · sessão XIV', leitor: 'trento14' },
      { n: 6, fonte: 'Cânones', ref: 'cân. 959-964', leitor: 'can959' },
    ],
  },
  videira: {
    titulo: 'Videira',
    fontes: 6,
    min: 15,
    blocos: [
      { n: 1, fonte: 'Escritura', ref: 'Jo 15,1-17', excerpt: '"Eu sou a videira verdadeira…"', leitor: 'jo15' },
      { n: 2, fonte: 'Catecismo', ref: '§§ 755-757', leitor: 'cic755' },
      { n: 3, fonte: 'Magistério', ref: 'Lumen Gentium 6', leitor: 'lg6' },
      { n: 4, fonte: 'Padres', ref: 'Agostinho · Tract. 81', leitor: 'aug81' },
      { n: 5, fonte: 'Suma', ref: 'ST III q.8', leitor: 'st3q8' },
      { n: 6, fonte: 'Cânones', ref: 'cân. 204', leitor: 'can204' },
    ],
  },
};

const EstudoComposto: React.FC = () => {
  const { slug = 'perdao' } = useParams();
  const t = CONTEUDO[slug] ?? CONTEUDO.perdao;

  return (
    <PrototypeShell title={t.titulo} back={`${BASE}/estudar`}>
      <h1 className="font-serif text-3xl">{t.titulo}</h1>
      <p className="text-xs text-muted-foreground mt-1">
        {t.fontes} fontes · ~{t.min} min
      </p>

      <ol className="mt-6 space-y-4">
        {t.blocos.map((b) => (
          <li key={b.n} className="border border-border rounded-md p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
              {b.n} · {b.fonte}
            </div>
            <Link to={`${BASE}/leitor?ref=${b.leitor}`} className="font-serif text-base hover:text-primary">
              {b.ref}
            </Link>
            {b.excerpt && (
              <p className="text-sm text-muted-foreground mt-1 italic">{b.excerpt}</p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Aplicação prática
        </p>
        <ul className="text-sm space-y-1">
          <li>• Convite ao Sacramento</li>
          <li>• Roteiro de exame</li>
        </ul>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-16 -mx-4 mt-8 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex divide-x divide-border">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm hover:bg-muted/40">
            <Bookmark size={14} /> Salvar
          </button>
          <Link to={`${BASE}/minha-jornada`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm hover:bg-muted/40">
            <PenLine size={14} /> Anotar
          </Link>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm hover:bg-muted/40">
            <Share2 size={14} /> Compartilhar
          </button>
        </div>
      </div>

      <div className="mt-6 border border-dashed border-primary/40 rounded p-4 text-center">
        <p className="text-sm text-muted-foreground">Continuar amanhã?</p>
        <Link to={`${BASE}/formar-se`} className="mt-2 inline-block text-sm text-primary underline underline-offset-2">
          → Vira Jornada de 7 dias
        </Link>
      </div>
    </PrototypeShell>
  );
};

export default EstudoComposto;
