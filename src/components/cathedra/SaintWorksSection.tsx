/**
 * SaintWorksSection — Seção "Biblioteca Patrística" na ficha do santo.
 *
 * Sprint SW-1.3 — Refator: cada obra é renderizada com <SaintWorkCard/>
 * (ficha editorial mínima). A regra de acesso (interno vs externo) e o
 * CTA duplo ficam encapsulados no card.
 */

import React, { useEffect, useState } from 'react';
import { Icons } from '../../constants';
import { listWorksBySaint } from '@/services/saintWorksService';
import type { SaintWork } from '@/types/saintWorks';
import SaintWorkCard from './SaintWorkCard';

interface Props {
  saintId: string;
  saintSlug?: string;
}

const SaintWorksSection: React.FC<Props> = ({ saintId, saintSlug }) => {
  const [works, setWorks] = useState<SaintWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listWorksBySaint(saintId)
      .then((rows) => {
        if (!alive) return;
        setWorks(rows);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [saintId]);

  if (loading) return null;
  if (!works.length) return null;

  const authorRef = saintSlug ?? saintId;

  return (
    <section className="space-y-spacing-md" aria-labelledby="biblioteca-patristica-heading">
      <div className="flex items-center gap-spacing-xs text-primary">
        <Icons.BookOpen className="w-spacing-md h-spacing-md" aria-hidden />
        <h3
          id="biblioteca-patristica-heading"
          className="text-premium-small font-black uppercase tracking-[0.2em]"
        >
          Biblioteca · Escritos completos
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
        {works.map((work) => (
          <SaintWorkCard key={work.id} work={work} authorRef={authorRef} />
        ))}
      </div>
    </section>
  );
};

export default SaintWorksSection;

