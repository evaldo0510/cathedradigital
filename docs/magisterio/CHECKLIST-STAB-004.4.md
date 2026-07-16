# STAB-004.4 — Refinamento visual do Magistério

Checklist de ajustes de **hierarquia, espaçamento e tipografia**.
Sem novos recursos. Sem mudança de rotas, contratos ou dados.

Legenda: ✅ feito nesta sprint · ⏳ pendente · 🔎 investigar

---

## 1. Acessibilidade (crítico)

- ✅ `aria-label="Voltar"` no botão de voltar do header sticky.
- ✅ `aria-label` + `aria-pressed` no toggle da busca e do Logos IA.
- ✅ Substituído `<h1>` duplicado do header sticky por `<p>` (mantém apenas o `<h1>` da ficha como H1 semântico único da página).
- ✅ `aria-hidden="true"` nos ícones decorativos do header sticky.
- ✅ Foco visível (`focus-visible:ring-2 focus-visible:ring-primary`) em: botões do header sticky, botões da SearchBar, botões de compartilhamento da ficha.
- ✅ Touch targets `min-h-11 min-w-11` (44×44) em todos os botões-ícone do header e da SearchBar (antes 32×32 = `h-spacing-xl w-spacing-xl`).
- ✅ Contraste: `text-primary/40` → `text-primary/70`; `text-muted-foreground/60`→`text-muted-foreground` no rótulo "Magistério" e no placeholder da busca.
- ✅ Contador de ocorrências vira `role="status"` + `aria-live="polite"`.
- ✅ Estado ativo dos toggles usa `bg-primary text-primary-foreground` (token) em vez de `text-white` hardcoded.
- ⏳ Substituir `window.confirm(...)` (retomar leitura, atalhos `Alt+↓`) por modal acessível (`AlertDialog`).
- ⏳ Auditar `AudioButton` — label do botão parece exibir `AUDIO_READ` (tokenização de label). Sprint separada.
- ⏳ Revisar `<kbd>` do indicador de atalhos (`bg-white/20`) para usar token neutro em dark mode.

## 2. Hierarquia visual

- ⏳ Ficha do documento: reduzir peso visual do bloco de temas (chips com borda pesada competem com título).
- ⏳ Ficha: mover ações de compartilhamento para o topo direito da ficha (padrão biblioteca), liberando o rodapé.
- ⏳ Header sticky: unificar `AudioButton`, `ReadingMark`, `ReadingControlPanel`, busca e Logos numa mesma barra de ferramentas com separadores sutis (`border-l border-primary/10`).
- ⏳ Blocos `MagisteriumDocumentNav`: destacar Anterior/Próximo do bloco "Outros de …" com maior espaço vertical (`mt-spacing-4xl`).
- ⏳ Bloco "Contemplação Concluída": está competindo com a navegação documental. Considerar mover para depois da nav ou simplificar (remover CTA duplicado "Voltar ao Topo").

## 3. Espaçamento

- ⏳ Padronizar `mb-spacing-2xl` entre ficha → texto → nav → rodapé (hoje mistura `mb-spacing-xl`, `mt-spacing-3xl`, `mt-spacing-4xl`).
- ⏳ Coluna de leitura: alinhar `px-spacing-md md:px-spacing-0` da ficha, do texto e da nav (já corrigido no texto — validar nos demais).
- ⏳ Nav documental: reduzir gap interno das cards (`p-spacing-md` → `p-spacing-sm md:p-spacing-md`) para casar densidade com a ficha.
- ⏳ Header sticky: `py-spacing-sm` fica apertado em desktop com botões 44px; validar `md:py-spacing-md`.

## 4. Tipografia

- ⏳ Título da ficha (`h1`): revisar `text-premium-3xl md:text-premium-4xl` — em telas médias pode quebrar em 3 linhas para documentos longos. Considerar `text-balance`.
- ⏳ Labels da ficha (`text-[9px]`, `text-[10px]`): consolidar num único token (`text-premium-eyebrow`) para não haver 2 tamanhos concorrentes.
- ⏳ Corpo do documento (`prose-p:leading-[1.8]`): validar se casa com `font-family-*` do `ReadingSettings` (serif vs sans).
- ⏳ Nav documental: título das cards em `font-serif text-premium-base` — bom; padronizar rótulos "Documento anterior/próximo" com o mesmo eyebrow da ficha.
- ⏳ Breadcrumb: `truncate max-w-[40ch]` no último item — validar em mobile (pode cortar título curto sem necessidade).

## 5. Responsividade (validar visualmente)

- 🔎 Mobile ≤380px: header sticky com 5 botões pode estourar. Considerar esconder `ReadingMark` no header e mantê-lo apenas no `ReadingProgress`.
- 🔎 Tablet 768–1024px: coluna `max-w-[70ch]` sem sidebar deixa muito ar lateral. Aceitável (foco em leitura), mas confirmar com o produto.
- 🔎 Selection toolbar: verificar sobreposição com a SearchBar sticky quando ambas ativas.

## 6. Fora do escopo desta sprint

- Redesign estrutural (3 páginas Biblioteca/Documento/Estudo) → **STAB-005**.
- Novos recursos (índice lateral, anotações, timeline) → sprints futuras.
- Auditoria dos módulos Catecismo/Bíblia/Relatio → depois de STAB-004.4 fechada.
