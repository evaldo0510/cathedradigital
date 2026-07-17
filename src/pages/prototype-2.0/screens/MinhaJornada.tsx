import React from 'react';
import { Link } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';

const BASE = '/prototype-2.0';

const MinhaJornada: React.FC = () => {
  return (
    <PrototypeShell title="Minha Jornada" back={`${BASE}/atrio`}>
      <h1 className="font-serif text-3xl">João</h1>
      <p className="text-xs text-muted-foreground mt-1">Peregrino · desde jul/2026</p>

      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Diário espiritual
        </p>
        <div className="border border-border rounded p-3 text-sm">
          <p className="italic text-muted-foreground">
            "Hoje meditei em Jo 15 — o Senhor me pede permanência…"
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">há 2 horas</p>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Favoritos
        </p>
        <ul className="text-sm space-y-1">
          <li>♥ <Link to={`${BASE}/leitor?ref=jo15`} className="hover:text-primary">Jo 15,5</Link></li>
          <li>♥ <Link to={`${BASE}/leitor?ref=sl23`} className="hover:text-primary">Sl 23</Link></li>
        </ul>
      </section>

      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Notas
        </p>
        <p className="text-sm text-muted-foreground">Nenhuma nota ainda.</p>
      </section>

      <section className="mt-6 border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Assinatura & Doação
        </p>
        <Link to="#" className="text-sm text-primary underline">
          Conhecer Cathedra PRO →
        </Link>
      </section>
    </PrototypeShell>
  );
};

export default MinhaJornada;
