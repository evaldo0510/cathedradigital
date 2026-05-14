# Checklist de Qualidade Visual e Funcional - Cathedra

Este documento serve como guia para manter a consistência e a solidez da interface do Cathedra em futuras atualizações.

## 1. Tipografia e Hierarquia
- [ ] **H1 (Display):** Cinzel, Font-bold, tracking-tight. Tamanhos: `text-4xl` (mobile) a `text-7xl` (desktop).
- [ ] **H2/H3:** Cinzel para títulos de seção, Merriweather para subtítulos serifados.
- [ ] **Corpo de Texto:** Inter para UI, Merriweather (`reader-text`) para conteúdos de leitura longa.
- [ ] **Contraste:** Garantir que textos informativos (labels) tenham no mínimo `primary/60` de opacidade sobre o fundo creme.

## 2. Espaçamentos (Grid & Layout)
- [ ] **Containers:** Usar sempre a classe `app-container` (`max-w-[1280px]` com paddings responsivos).
- [ ] **Seções:** Usar `section-spacing` para garantir respiro entre blocos de conteúdo (`py-24` a `py-48`).
- [ ] **Gaps:** Padronizar gaps de grid: `gap-8` (mobile) a `gap-12` (desktop).
- [ ] **Bordas:** Usar `border-border/10` ou `border-border/5` para divisórias sutis.

## 3. Componentes (Cards & Botões)
- [ ] **Cards:** Usar `desktop-card` (border-radius: `3xl`, padding generoso, sombra sutil).
- [ ] **Botões:** Arredondados (`rounded-full`), texto em caixa alta (`uppercase`), tracking espaçado (`tracking-[0.2em]`).
- [ ] **Interatividade:** Todo elemento clicável deve ter feedback visual claro e `:focus-visible`.

## 4. Acessibilidade (A11y)
- [ ] **Foco:** Anéis de foco visíveis em todos os elementos interativos (`ring-2 ring-primary`).
- [ ] **ARIA:** `aria-label` em botões sem texto claro e `aria-hidden` em ícones decorativos.
- [ ] **Semântica:** Uso correto de tags `<main>`, `<section>`, `<header>`, `<footer>` e níveis de heading.

## 5. Performance & Responsividade
- [ ] **Imagens:** `loading="lazy"` para tudo abaixo do fold. `fetchPriority="high"` para o Hero.
- [ ] **Mobile:** Testar em 360px e 375px. Evitar quebras de linha estranhas em títulos longos.
- [ ] **Lazy Load:** Novas seções pesadas na landing devem ser importadas via `React.lazy`.

---
*Última atualização: Maio de 2026*
