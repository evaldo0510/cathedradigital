import React from 'react';
import { Link } from 'react-router-dom';
import PrototypeShell from '../PrototypeShell';
import { ChevronRight } from 'lucide-react';

const BASE = '/prototype-2.0';

const OFICIO = [
  { label: 'Missa', ref: 'laudes' },
  { label: 'Laudes', ref: 'laudes' },
  { label: 'Meio-dia', ref: 'laudes' },
  { label: 'Vésperas', ref: 'laudes' },
  { label: 'Completas', ref: 'laudes' },
];

const DEVOCOES = [
  { label: 'Rosário', ref: 'laudes' },
  { label: 'Via-Sacra', ref: 'laudes' },
  { label: 'Ladainhas', ref: 'laudes' },
  { label: 'Lectio Divina', ref: 'jo15' },
  { label: 'Exame de consciência', ref: 'laudes' },
];

const Rezar: React.FC = () => {
  return (
    <PrototypeShell title="Rezar" back={`${BASE}/atrio`} liturgicalColor="hsl(280 30% 40%)">
      <section>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Ofício</p>
        <ul className="border border-border rounded divide-y divide-border">
          {OFICIO.map((o) => (
            <li key={o.label}>
              <Link
                to={`${BASE}/leitor?ref=${o.ref}&prece=1`}
                className="flex items-center justify-between p-3 text-sm hover:bg-muted/40"
              >
                {o.label} <ChevronRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Devoções</p>
        <ul className="border border-border rounded divide-y divide-border">
          {DEVOCOES.map((d) => (
            <li key={d.label}>
              <Link
                to={`${BASE}/leitor?ref=${d.ref}&prece=1`}
                className="flex items-center justify-between p-3 text-sm hover:bg-muted/40"
              >
                {d.label} <ChevronRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PrototypeShell>
  );
};

export default Rezar;
