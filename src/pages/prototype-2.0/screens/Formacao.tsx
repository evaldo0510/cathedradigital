import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';

const BASE = '/prototype-2.0';

const Formacao: React.FC = () => {
  const [tab, setTab] = useState<'andamento' | 'recomendadas' | 'catalogo'>('andamento');

  return (
    <PrototypeShell title="Formar-se" back={`${BASE}/atrio`}>
      <div className="flex gap-1 border-b border-border -mx-4 px-4 mb-4">
        {[
          { id: 'andamento', label: 'Em andamento' },
          { id: 'recomendadas', label: 'Recomendadas' },
          { id: 'catalogo', label: 'Catálogo' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'andamento' && (
        <>
          <section>
            <h2 className="font-serif text-2xl">Introdução à Fé</h2>
            <p className="text-xs text-muted-foreground mt-1">Dia 4 de 14</p>
            <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '28%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">28%</p>

            <div className="mt-5 border border-border rounded-md p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                Hoje: Credo, artigo 3
              </p>
              <ul className="text-sm space-y-1.5">
                <li>
                  • <Link to={`${BASE}/leitor?ref=jo15`} className="text-primary hover:underline">Ler Jo 1,1-18</Link>
                </li>
                <li>
                  • <Link to={`${BASE}/leitor?ref=cic1234`} className="text-primary hover:underline">CIC §§ 456-478</Link>
                </li>
                <li>• Reflexão guiada (Logos)</li>
                <li>
                  • <Link to={`${BASE}/minha-jornada`} className="text-primary hover:underline">Anotar no Diário</Link>
                </li>
              </ul>
              <Link
                to={`${BASE}/leitor?ref=jo15`}
                className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium"
              >
                Continuar
              </Link>
            </div>
          </section>

          <section className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Próximos dias
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>○ 5 · Encarnação</li>
              <li>○ 6 · Nascimento</li>
              <li>○ 7 · Vida oculta</li>
            </ul>
          </section>

          <section className="mt-6 border-t border-border pt-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Outras jornadas ativas
            </p>
            <Link
              to={`${BASE}/formar-se`}
              className="block border border-border rounded p-3 hover:border-primary"
            >
              <div className="text-sm font-medium">40 dias com S. Agostinho</div>
              <div className="text-xs text-muted-foreground">Dia 12/40</div>
            </Link>
          </section>
        </>
      )}

      {tab === 'recomendadas' && (
        <ul className="space-y-3">
          {[
            'Introdução ao Rosário (7 dias)',
            'Padres do deserto (14 dias)',
            'Preparação para o Advento (28 dias)',
          ].map((j) => (
            <li key={j} className="border border-border rounded p-3 hover:border-primary">
              <div className="text-sm font-medium">{j}</div>
              <div className="text-xs text-muted-foreground mt-1">Curada por Tempo Comum</div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'catalogo' && (
        <ul className="space-y-2 text-sm">
          {['Introdução à Fé', 'Rosário completo', 'Suma Teológica em 90 dias', 'Padres da Igreja I', 'Concílio Vaticano II'].map((j) => (
            <li key={j} className="border border-border rounded p-3 hover:border-primary">
              {j}
            </li>
          ))}
        </ul>
      )}
    </PrototypeShell>
  );
};

export default Formacao;
