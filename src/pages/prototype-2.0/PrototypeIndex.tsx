import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Índice do protótipo navegável do Cathedra 2.0.
 * Mostra as 5 telas e o mapa de jornadas J1–J6.
 */

const BASE = '/prototype-2.0';

const SCREENS = [
  { to: `${BASE}/atrio`, label: 'Átrio', desc: 'Entrada e retomada (Ritual do Dia)' },
  { to: `${BASE}/estudar`, label: 'Biblioteca (Estudar)', desc: 'Por Tema · Por Fonte · Testemunhos' },
  { to: `${BASE}/leitor?ref=jo15`, label: 'Leitor Universal', desc: 'Bíblia · CIC · Padres — mesma casca' },
  { to: `${BASE}/pesquisar`, label: 'Pesquisa (⌘K)', desc: 'Overlay agrupado por fonte' },
  { to: `${BASE}/formar-se`, label: 'Formação', desc: 'Jornadas em andamento' },
];

const JOURNEYS = [
  { id: 'J1', name: 'Primeiro acesso', path: 'Átrio (anônimo) → Ritual do Dia → Leitor' },
  { id: 'J2', name: 'Primeiro estudo', path: 'Átrio → Estudar → Tema "Perdão" → Estudo Composto → Leitor' },
  { id: 'J3', name: 'Primeira oração', path: 'Átrio → Ofício → Leitor (Modo Prece)' },
  { id: 'J4', name: 'Pesquisa', path: '⌘K "videira" → Resultado → Leitor' },
  { id: 'J5', name: 'Favoritos', path: 'Leitor → ♥ → Minha Jornada' },
  { id: 'J6', name: 'Continuação', path: 'Átrio → ↩ Retomar → Leitor no ponto anterior' },
];

const PrototypeIndex: React.FC = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground font-sans max-w-3xl mx-auto px-6 py-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
          Cathedra 2.0 · Protótipo navegável
        </p>
        <h1 className="font-serif text-3xl mb-2">Índice do protótipo</h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Baixa fidelidade, propositalmente cru. O objetivo é validar estrutura, fluxos e nomenclatura
          — não estética final. Todas as jornadas J1–J6 são clicáveis. Nenhum backend é chamado.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-3">5 telas principais</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SCREENS.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="block border border-border rounded-md p-4 hover:border-primary hover:bg-muted/40 transition-colors"
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-3">Jornadas mapeadas</h2>
        <ol className="space-y-2">
          {JOURNEYS.map((j) => (
            <li key={j.id} className="border-l-2 border-primary/40 pl-3 py-1">
              <div className="text-xs font-mono text-primary">{j.id} · {j.name}</div>
              <div className="text-sm">{j.path}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-3">Como navegar</h2>
        <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
          <li>Header: 🔎 abre Pesquisa · ↩ retoma último item · 👤 vai a Minha Jornada.</li>
          <li>Bottom-nav: 5 cômodos do sitemap 2.0.</li>
          <li>Toque em cartões de tema, versículo âncora (°) ou item de Formação para seguir o fluxo.</li>
          <li>Botão "Protótipo 2.0" no canto superior direito devolve a este índice.</li>
        </ul>
      </section>

      <footer className="pt-6 border-t border-border text-xs text-muted-foreground">
        <Link to="/" className="underline">← Voltar ao Cathedra atual (1.0)</Link>
      </footer>
    </div>
  );
};

export default PrototypeIndex;
