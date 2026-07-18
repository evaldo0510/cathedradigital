## Objetivo
Adicionar 3 specs Playwright cobrindo o handler de swipe do painel Nexus (mobile), sem alterar código de produção.

## Arquivos novos
- `tests/e2e/nexus-swipe-mobile.spec.ts` — swipe-left/right alternando seções.
- `tests/e2e/nexus-swipe-clamp.spec.ts` — clamp nas bordas (primeira/última).
- `tests/e2e/nexus-swipe-vertical.spec.ts` — scroll vertical não vira swipe.

## Base comum
- Projetos mobile já configurados: `mobile-390`, `mobile-chrome`, `mobile-safari` (`hasTouch: true`).
- Abrir Nexus via deep link `#nexus=<slug>` numa rota que monta `<NexusBubbles />` (ex.: `/bible/...` ou `/catechism`). Aguardar `[data-testid="nexus-active-section"]` visível.
- Usar `captureConsole` de `tests/e2e/utils/console-rules.ts` para asserir zero `console.error` / `pageerror`.
- Gestos com `page.touchscreen` (`touchscreen.tap` + sequência `touchStart/Move/End` via `page.evaluate` de `TouchEvent`, ou API `page.locator(...).dispatchEvent`). Preferir o helper Playwright:
  ```ts
  await sheet.dispatchEvent('touchstart', { touches: [{ clientX: 320, clientY: 400 }] });
  await sheet.dispatchEvent('touchend',   { changedTouches: [{ clientX: 100, clientY: 405 }] });
  ```
  Threshold no componente = 50px, `|dy| < |dx|`.

## Spec 1 — swipe-mobile
1. Abre Nexus com ≥3 seções.
2. Lê `data-section-kind` inicial (idx 0).
3. Swipe-left → afirma que `data-section-kind` mudou e idx aumentou (via contagem de dots ou atributo).
4. Swipe-right → volta ao kind original.
5. Nenhum bubble é dead-end: todos com `href` resolvido (sem `aria-disabled="true"`).
6. Zero console errors.

## Spec 2 — clamp bordas
1. Abre Nexus, força seção 0 (primeira).
2. Swipe-right (voltar) 2x → `data-section-kind` permanece = primeira; nenhum re-render quebrado (painel ainda visível, aria-live sem mensagem de mudança nova entre as duas tentativas).
3. Navega até última seção (Alt+→ repetido ou swipe-left N vezes).
4. Swipe-left 2x → permanece na última.
5. Zero console errors; painel continua interativo (botão fechar responde).

## Spec 3 — scroll vertical não vira swipe
1. Abre Nexus com conteúdo que ultrapassa a viewport.
2. Captura `data-section-kind` e `scrollTop` do container rolável.
3. Gesto vertical dentro do painel (`dy = 200`, `dx = 10`) — deve rolar, não trocar seção.
4. Afirma: `data-section-kind` inalterado; `scrollTop` aumentou.
5. Repete com gesto iniciado sobre um bubble (elemento interativo): não deve navegar nem trocar seção (handler ignora quando alvo é interativo).
6. Zero console errors.

## Execução
- Rodar apenas em projetos mobile: `test.skip(({ isMobile }) => !isMobile)` ou `test.describe.configure({ mode: 'serial' })` + filtro por `testInfo.project.name`.
- Sem novas deps; sem mudanças em `playwright.config.ts`.

## Fora de escopo
- Não alterar `NexusBubbles.tsx` nem `nexusState.ts`.
- Não mexer em workflows CI (os projetos mobile já rodam via matriz existente).
