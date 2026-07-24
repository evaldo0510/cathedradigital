/**
 * Cathedra · Módulo Catequese — rotas lazy (Sprint CQ-1.2).
 *
 * Consumido opcionalmente por `src/App.tsx` quando `VITE_MODULES_CATEQUESE=1`.
 * Enquanto a flag está em `0` (default até CQ-1.4), App.tsx continua usando os
 * shims dos paths antigos, que reexportam deste mesmo módulo — comportamento
 * idêntico, sem duplicação de código.
 */

import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CatechismSkeleton } from '@/components/cathedra/RouteSkeletons';

const AtriumCatechismReader = lazy(() =>
  import('./reader/AtriumCatechismReader'),
);
const Catechism = lazy(() => import('./reader/Catechism'));

const CatequeseRoutes: React.FC = () => (
  <Routes>
    <Route
      path="catechism"
      element={
        <Suspense fallback={<CatechismSkeleton />}>
          <AtriumCatechismReader />
        </Suspense>
      }
    />
    <Route
      path="catechism-legacy"
      element={
        <Suspense fallback={<CatechismSkeleton />}>
          <Catechism />
        </Suspense>
      }
    />
    <Route path="catecismo" element={<Navigate to="/catechism" replace />} />
    <Route
      path="catechism-explorer"
      element={<Navigate to="/catechism" replace />}
    />
  </Routes>
);

export default CatequeseRoutes;
