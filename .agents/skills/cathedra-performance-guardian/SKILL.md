---
name: cathedra-performance-guardian
description: Guardião de performance do Cathedra. Use em toda alteração que impacte carregamento, rendering ou bundle. Verifica CLS, LCP, lazy loading, suspense, skeletons, memoization, react-query e tamanho do bundle.
---

# Performance Guardian

Performance é parte da identidade contemplativa. Tela lenta quebra o silêncio.

## Métricas alvo (Core Web Vitals)

- **LCP** ≤ 2.5s
- **CLS** ≤ 0.05 (contemplativo: 0)
- **INP** ≤ 200ms
- **Bundle inicial** ≤ 200KB gzip
- **Busca (Bíblia/Glossário)** ≤ 100ms

## Regras

### Code splitting
- Rotas via `React.lazy` + `Suspense`.
- Fallback = `ContentSkeleton` (não spinner).
- Não fazer lazy de componentes usados acima da dobra.

### Rendering
- `useMemo`/`useCallback` em cálculos custosos ou props de componentes memoizados.
- `React.memo` em componentes de lista pesada.
- Nunca objeto/array inline como prop de componente memoizado.
- Readers contemplativos: zero re-render por scroll.

### React Query
- Toda leitura Supabase via React Query.
- `staleTime` adequado (5min padrão; 1h para dados quase-estáticos como CIC).
- `queryKey` estável — sem objetos anônimos.
- Sem chamada Supabase duplicada por página.

### Imagens
- `image_slug` + lazy loading (`loading="lazy"`).
- `width`/`height` explícitos para evitar CLS.
- Formato moderno (webp/avif) via CDN.
- Nunca imagem base64 grande no bundle.

### Bundle
- Sem `import` de lib inteira quando cabe `import { fn } from 'lib/fn'`.
- Sem `moment.js`, `lodash` inteiro (usar `date-fns`, funções específicas).
- Dinamic import para libs pesadas (jsPDF, DOMPurify) usadas condicionalmente.

## Proibições

- Query Supabase dentro de loop de render.
- Hook duplicado buscando o mesmo dado em componentes irmãos (subir para provider).
- Spinner genérico em vez de skeleton.
- Imagem sem dimensões (causa CLS).
- `useEffect` com deps quebrada (loop infinito).

## Checklist

- [ ] Rota nova em `React.lazy`
- [ ] Skeleton definido como fallback
- [ ] Sem re-render em Reader (validar com Playwright)
- [ ] Queries via React Query com `queryKey` estável
- [ ] Imagens com width/height + lazy
- [ ] Bundle não cresceu >5KB gzip (validar CI)
- [ ] `scripts/nexus-perf-guardrail.ts` dentro do budget
