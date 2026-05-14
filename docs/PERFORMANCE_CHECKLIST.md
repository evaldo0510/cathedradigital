# Checklist de Performance e Qualidade Visual - Cathedra

## 1. Carregamento e Entrega (Core Web Vitals)
- [x] **LCP (Largest Contentful Paint)**: Hero image (avatar) carregada com `loading="eager"`.
- [x] **FCP (First Contentful Paint)**: Suspense boundaries aplicados por seção para evitar bloqueio do render.
- [x] **Lazy Loading**: Seções abaixo do fold (Features, Pricing, FAQ) carregadas sob demanda.
- [x] **Code Splitting**: Componentes pesados (LogosChat, GuidedJourney) separados em bundles menores.
- [x] **Imagens**: Uso de `content-visibility: auto` no CSS global para otimizar renderização fora da tela.

## 2. Acessibilidade (WCAG 2.1)
- [x] **Foco Visível**: `focus-visible` com ring de 2px e offset em todos os elementos interativos.
- [x] **Navegação por Teclado**: Logo e menus operáveis via Enter/Space e Tab.
- [x] **Contrast**: Relação > 7:1 entre texto e fundo (Cream vs Dark Blue).
- [x] **ARIA Labels**: Botões de ícones e links críticos rotulados corretamente.
- [x] **Hierarquia**: H1 único por página, seguido por H2 e H3 consistentes.

## 3. Responsividade Mobile (360px - 375px)
- [x] **Escalabilidade de Fonte**: Tipografia responsiva via `index.css`.
- [x] **Toque**: Target size de botões > 44px conforme diretrizes da Apple/Google.
- [x] **Horizontal Scroll**: Travado via `overflow-x-hidden` no root.

## 4. Testes de Regressão Visual
- [x] **Vitest Suite**: Testes automáticos em `src/tests/visual-audit.test.tsx` validando tokens de design.
