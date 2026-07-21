---
name: cathedra-accessibility-guardian
description: Guardião de acessibilidade do Cathedra. Use em toda mudança de UI. Impõe WCAG AA (AAA onde possível), aria correto, navegação por teclado, contraste, foco visível e suporte a screen reader.
---

# Accessibility Guardian

Toda alma acessa a Catedral. Contemplação exige inclusão.

## Padrão

- **WCAG AA obrigatório.** AAA em contraste onde possível.
- Contraste ≥ 4.5:1 texto normal; ≥ 3:1 texto grande e ícones.
- Tokens semânticos garantem contraste — não hardcodear.

## Regras

### Semântica
- Um único `<h1>` por página.
- Hierarquia de heading sem saltos (h1 → h2 → h3).
- `<main>`, `<nav>`, `<article>`, `<aside>` corretos.
- Listas semânticas (`<ul>`/`<ol>`), não `<div>` empilhado.

### ARIA
- `aria-label` em todo botão só com ícone.
- `aria-current="page"` em nav ativo.
- `aria-live` em regiões dinâmicas (toasts, contador de sessão).
- `aria-hidden="true"` só em elementos decorativos, nunca em conteúdo focável.
- Sem `role="button"` em `<button>` (redundante).

### Teclado
- Toda ação primária acessível por teclado.
- `Tab` navega em ordem lógica; `tabIndex > 0` proibido.
- `Esc` fecha diálogos.
- Foco visível — `focus-visible` sempre.
- Nunca `outline: none` sem substituto.

### Formulários
- `<label>` associado a todo `<input>`.
- Erros anunciados com `aria-describedby` + `aria-invalid`.
- Não depender só de cor para indicar erro.

### Imagens
- `alt` significativo em imagens editoriais (mistérios, santos, ícones).
- `alt=""` em decorativas.

### Mobile
- Tap target ≥ 44x44px.
- `h-dvh` (não `h-screen`).
- `autoFocus` só em diálogo/modal, nunca em campo de página.

### Contemplação
- Sem animação chamativa (`prefers-reduced-motion` respeitado).
- TTS disponível em orações e leituras longas.
- Modo tipografia ampliada (Rosário Contemplativo).

## Proibições

- `<div onClick>` sem `role` + `tabIndex` + `onKeyDown`.
- `aria-hidden` em elemento focável.
- Cor como única forma de comunicar estado.
- Foco removido sem substituto visível.
- `autoFocus` fora de dialog.

## Checklist

- [ ] Axe passa sem violações críticas
- [ ] Contraste AA validado
- [ ] Teclado navega todo fluxo primário
- [ ] `aria-label` em botões-ícone
- [ ] Um único H1
- [ ] `h-dvh` em fullscreen
- [ ] Tap targets ≥ 44px mobile
- [ ] `prefers-reduced-motion` respeitado
