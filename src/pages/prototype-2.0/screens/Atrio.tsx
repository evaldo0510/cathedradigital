import React from 'react';
import { Link } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';

const BASE = '/prototype-2.0';

const Atrio: React.FC = () => {
  return (
    <PrototypeShell title="Cathedra">
      <p className="font-serif text-3xl leading-tight">Pax et bonum, João</p>
      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
        Tempo Comum · sexta-feira
      </p>

      {/* Cartão de Ação principal — Ritual do Dia */}
      <section className="mt-6 border border-border rounded-lg p-5 bg-card">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
          Ritual do dia
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" /> Escuta · Sl 23
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full border border-muted-foreground" /> Leitura · Jo 15
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full border border-muted-foreground" /> Exame
          </li>
        </ul>
        <Link
          to={`${BASE}/leitor?ref=sl23`}
          className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium"
        >
          Iniciar
        </Link>
      </section>

      {/* Ofício de hoje */}
      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Ofício de hoje
        </p>
        <p className="text-sm">Laudes · Missa · Vésperas</p>
        <Link
          to={`${BASE}/leitor?ref=laudes&prece=1`}
          className="mt-2 inline-block text-sm text-primary underline underline-offset-2"
        >
          Rezar Laudes →
        </Link>
      </section>

      {/* Santo do dia */}
      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Santo do dia
        </p>
        <p className="font-serif text-lg">S. Boaventura, D.I.</p>
      </section>

      {/* Continuidade — J6 */}
      <section className="mt-6 border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          ↩ Retomar
        </p>
        <ul className="space-y-1.5 text-sm">
          <li>
            <Link to={`${BASE}/leitor?ref=jo15`} className="hover:text-primary">
              • Jo 15:12
            </Link>
          </li>
          <li>
            <Link to={`${BASE}/leitor?ref=cic1234`} className="hover:text-primary">
              • CIC §1234
            </Link>
          </li>
          <li>
            <Link to={`${BASE}/formar-se`} className="hover:text-primary">
              • Jornada Introdução (4/14)
            </Link>
          </li>
        </ul>
      </section>

      {/* Nexus sugere */}
      <section className="mt-6 border border-dashed border-border rounded p-3">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
          Nexus sugere °
        </p>
        <Link to={`${BASE}/estudar/tema/videira`} className="text-sm hover:text-primary">
          "Videira" atravessa 6 fontes →
        </Link>
      </section>
    </PrototypeShell>
  );
};

export default Atrio;
