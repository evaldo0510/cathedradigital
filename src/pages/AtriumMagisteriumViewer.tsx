/**
 * AtriumMagisteriumViewer — envoltório editorial do MagisteriumViewer.
 * Mantém a lógica existente intacta e apenas aplica o chrome sticky.
 */

import React, { Suspense, lazy, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';
import { MAGISTERIUM_CATEGORIES } from '@/data/magisterium-urls';
import { AppRoute } from '@/types';

const MagisteriumViewer = lazy(
  () => import('@/components/cathedra/MagisteriumViewer'),
);

const AtriumMagisteriumViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const meta = useMemo(() => {
    if (!id) return null;
    for (const cat of MAGISTERIUM_CATEGORIES) {
      const doc = cat.documents.find((d) => d.id === id);
      if (doc) return doc;
    }
    return null;
  }, [id]);

  const kicker = meta
    ? `Cathedra · Magistério${meta.type ? ` · ${meta.type}` : ''}`
    : 'Cathedra · Magistério';
  const title = meta?.title ?? 'Documento do Magistério';
  const subtitleParts = [meta?.author, meta?.year ? String(meta.year) : null].filter(Boolean);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined;

  return (
    <>
      <EditorialReaderChrome
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        backHref={AppRoute.MAGISTERIUM}
      />
      <Suspense fallback={null}>
        <MagisteriumViewer />
      </Suspense>
    </>
  );
};

export default AtriumMagisteriumViewer;
