## Objetivo
Elevar a acessibilidade e a "shareability" do painel Nexus com 4 melhorias focadas em `NexusBubbles.tsx` e `nexusState.ts`, sem tocar em lógica de negócio ou no Knowledge Engine.

## Escopo

### 1. aria-live para sync entre abas
- Em `nexusState.ts`, adicionar helpers:
  - `syncedSectionLiveMessage(idx, total, eyebrow)` → "Atualizado por outra aba — agora na Seção X de Y: ...".
  - `syncedFocusModeLiveMessage(on)` → "Modo foco ativado em outra aba." / "...desativado...".
- Em `NexusBubbles.tsx`, no handler de `storage`:
  - Comparar `activeSectionIdx` remoto vs local → se mudou, `setLiveMessage(syncedSectionLiveMessage(...))`.
  - Comparar `focusMode` remoto vs local → se mudou, `setLiveMessage(syncedFocusModeLiveMessage(...))`.
- Cobrir com testes em `nexusState.test.ts`.

### 2. Focus trap dentro do painel
- Criar hook local `useFocusTrap(containerRef, active)` em `src/lib/useFocusTrap.ts`:
  - Captura `Tab`/`Shift+Tab`, ciclando entre elementos focáveis do container.
  - Restaura foco ao elemento anterior no unmount.
  - Respeita `Escape` (delegado ao Sheet).
- Aplicar em `NexusBubbles.tsx` no `SheetContent` (só quando `open`).
- Compatível com Radix Sheet (que já faz trap em modal); reforço garante consistência inclusive em Modo Foco.

### 3. Deep link inválido → seção padrão + aria-live
- Em `nexusState.ts`, adicionar `validateDeepLinkKind(kind, availableKinds)`:
  - Retorna `{ valid: boolean, fallbackKind?: string }`.
- Em `NexusBubbles.tsx`, no efeito que resolve `parseNexusHash`:
  - Se `deep.slug` não existir nas tags → não abrir, limpar hash silenciosamente.
  - Se `deep.kind` não estiver em `narrativeSections` → abrir na seção 0 e emitir `setLiveMessage(invalidDeepLinkLiveMessage(deep.kind))` → "Seção '{kind}' não disponível. Abrindo seção padrão."
- Novo helper `invalidDeepLinkLiveMessage(kind)` em `nexusState.ts`.
- Testes cobrindo validação e mensagem.

### 4. Botão "Compartilhar deep link"
- Já existe `handleShareDeepLink` no componente. Ajustes:
  - Garantir que a URL gerada inclui `slug:kind` da seção **ativa** (não apenas slug).
  - Usar `buildNexusShareUrl(window.location.href, slug, activeKind)`.
  - Integrar com hook `useShare` (Web Share API nativo → fallback clipboard + toast).
  - Botão visível no cabeçalho do painel (`⧉`) com `aria-label="Compartilhar seção atual do Nexus"` e tap target ≥44px.
  - Ocultar em Modo Foco? Não — manter visível para não bloquear compartilhamento.

## Detalhes técnicos

**Arquivos alterados**
- `src/lib/nexusState.ts` — 4 helpers novos + `validateDeepLinkKind`.
- `src/lib/useFocusTrap.ts` — hook novo, ~40 linhas.
- `src/components/cathedra/NexusBubbles.tsx` — integração dos 4 itens.
- `src/test/nexusState.test.ts` — casos de sync, deep-link inválido, share URL com kind.

**Fora de escopo**
- Nada em Knowledge Engine, presets narrativos, Supabase ou telemetria.
- Sem alterações visuais além do botão ⧉ (já presente) e do hook de trap (invisível).

## Validação
- `bun test src/test/nexusState.test.ts` (22 + ~8 novos).
- `tsgo --noEmit`.
- Playwright manual: abrir 2 abas, alternar seção em uma, confirmar aria-live na outra (via `[aria-live]` region no DOM).
- Deep link inválido: `#nexus=maria:inexistente` → abre seção 0 + mensagem.

Confirmo e executo?
