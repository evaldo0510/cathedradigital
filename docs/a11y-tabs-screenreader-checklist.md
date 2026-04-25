# Checklist de Validação — Acessibilidade de Tabs com Leitores de Tela

Este documento padroniza os testes manuais de acessibilidade para todos os componentes de **abas (Tabs)** do Cathedra Digital, garantindo conformidade com **WAI-ARIA Authoring Practices 1.2** (padrão `tabs`) e leitura correta em **NVDA** (Windows) e **VoiceOver** (macOS/iOS).

---

## 1. Pré-requisitos

### Ambiente de teste
- **Windows**: Firefox ou Chrome + NVDA 2024.1+ (gratuito — [nvaccess.org](https://www.nvaccess.org/download/))
- **macOS**: Safari + VoiceOver (Cmd+F5 para ativar)
- **iOS**: Safari + VoiceOver (Ajustes → Acessibilidade → VoiceOver)
- **Modo navegação**: NVDA deve estar em **modo foco** (Insert+Espaço) ao testar tabs

### Componentes auditados
Os seguintes componentes implementam o padrão `role="tablist"` e devem ser validados:

- [ ] `src/components/cathedra/CommunityPage.tsx` — Abas de comunidade
- [ ] `src/components/cathedra/QuickModals.tsx` — Modais com abas internas
- [ ] `src/components/cathedra/EncyclopediaPage.tsx` — Bíblia / Catecismo / Magistério
- [ ] `src/components/cathedra/AdminDashboard.tsx` — Painéis administrativos
- [ ] `src/components/cathedra/JourneyDetailPage.tsx` — Visão geral / Passos / Diagnóstico
- [ ] `src/components/cathedra/ProfilePage.tsx` — Perfil / Conquistas / Anotações
- [ ] `src/components/cathedra/SaintsPage.tsx` — Lista / Calendário
- [ ] `src/components/cathedra/SearchResultsPage.tsx` — Filtros por tipo
- [ ] `src/components/cathedra/RitualPage.tsx` — Manhã / Tarde / Noite
- [ ] `src/components/cathedra/ThemePage.tsx` — Reflexão / Orações / Santos relacionados

---

## 2. Critérios de aceitação (por componente)

Cada componente de abas deve passar em **todos** os itens abaixo.

### 2.1 Estrutura ARIA
- [ ] Container possui `role="tablist"` e `aria-label` ou `aria-labelledby` descritivo
- [ ] Cada aba possui `role="tab"`, `id` único, `aria-controls="<panel-id>"` e `aria-selected="true|false"`
- [ ] Cada painel possui `role="tabpanel"`, `id` único e `aria-labelledby="<tab-id>"`
- [ ] IDs **não duplicados** entre páginas (verificar com `document.querySelectorAll('[id]')` no console)
- [ ] Apenas a aba ativa tem `tabIndex={0}`; demais têm `tabIndex={-1}` (roving tabindex)

### 2.2 Navegação por teclado
- [ ] **Tab** entra no tablist e foca apenas a aba ativa
- [ ] **Tab** novamente sai do tablist e vai para o conteúdo do tabpanel
- [ ] **Shift+Tab** retorna ao tablist e foca a aba ativa
- [ ] **ArrowRight** move foco para próxima aba (com wrap no final)
- [ ] **ArrowLeft** move foco para aba anterior (com wrap no início)
- [ ] **Home** foca primeira aba; **End** foca última aba
- [ ] **Enter** ou **Espaço** ativa a aba focada e atualiza o tabpanel visível
- [ ] **Escape** (em tabs dentro de modal) fecha o modal sem perder contexto

### 2.3 Foco visível
- [ ] Aba focada exibe outline/ring visível (mínimo 2px, contraste ≥ 3:1)
- [ ] Estilo de foco distinto do estado `aria-selected="true"`
- [ ] Foco não é removido ao alternar entre abas via teclado

---

## 3. Roteiro de teste com NVDA (Windows)

### Setup
1. Abra Firefox e acesse a página alvo
2. Inicie NVDA (Ctrl+Alt+N)
3. Pressione **Insert+Espaço** para garantir modo foco

### Fluxo de validação
| Passo | Ação | Anúncio esperado do NVDA |
|-------|------|--------------------------|
| 1 | Tab até o tablist | "Bíblia, aba, selecionada, 1 de 3" |
| 2 | ArrowRight | "Catecismo, aba, 2 de 3" *(não-selecionada)* |
| 3 | Enter ou Espaço | "Catecismo, aba, selecionada" + foco move para painel |
| 4 | Tab | Lê primeiro conteúdo do tabpanel ("região Catecismo, …") |
| 5 | Shift+Tab | Retorna à aba "Catecismo, aba, selecionada" |
| 6 | Home | "Bíblia, aba, 1 de 3" |
| 7 | End | "Magistério, aba, 3 de 3" |

### Critério de aprovação NVDA
- [ ] Anuncia o **nome** da aba antes do role
- [ ] Anuncia "**aba**" (role tab)
- [ ] Anuncia "**selecionada**" apenas para a aba ativa
- [ ] Anuncia "**X de N**" (posição/total)
- [ ] Ao entrar no painel, anuncia "**região**" + label do painel

---

## 4. Roteiro de teste com VoiceOver (macOS)

### Setup
1. Abra Safari e acesse a página alvo
2. Ative VoiceOver (**Cmd+F5**)
3. Use **VO = Control+Option** como modificador

### Fluxo de validação
| Passo | Ação | Anúncio esperado do VoiceOver |
|-------|------|-------------------------------|
| 1 | VO+Right até o tablist | "Lista de abas, Bíblia, aba selecionada, 1 de 3" |
| 2 | VO+Right ou ArrowRight | "Catecismo, aba, 2 de 3" |
| 3 | VO+Espaço (ou Enter) | "Catecismo, aba selecionada" |
| 4 | VO+Right | Entra no tabpanel: "Catecismo, painel de abas" |
| 5 | VO+Right repetido | Lê conteúdo interno do painel |

### Critério de aprovação VoiceOver
- [ ] Anuncia "**aba**" e "**selecionada**" ao alternar
- [ ] Anuncia "**painel de abas**" ao entrar no tabpanel
- [ ] Rotor (VO+U → "Marcos") lista os painéis com seus labels corretos

---

## 5. Roteiro VoiceOver iOS (mobile)

1. Ative VoiceOver (Ajustes → Acessibilidade → VoiceOver)
2. Acesse a PWA Cathedra Digital no Safari
3. **Swipe right** entre abas — deve anunciar "aba, X de N, selecionada/não-selecionada"
4. **Double-tap** ativa a aba focada
5. **Swipe right** após ativação entra no tabpanel

### Critério mobile
- [ ] Toque duplo ativa aba (sem precisar de teclado)
- [ ] Rotor lê todas as abas como grupo
- [ ] Sem "botão sem nome" no anúncio

---

## 6. Registro de testes executados

> Preencher a cada release. Anexar screenshots/áudio quando possível.

### Sessão #1 — `[YYYY-MM-DD]` — Responsável: `[nome]`

| Componente | NVDA/Firefox | VO/Safari macOS | VO/Safari iOS | Observações |
|------------|:------------:|:---------------:|:-------------:|-------------|
| CommunityPage | ⬜ | ⬜ | ⬜ | |
| QuickModals | ⬜ | ⬜ | ⬜ | |
| EncyclopediaPage | ⬜ | ⬜ | ⬜ | |
| AdminDashboard | ⬜ | ⬜ | ⬜ | |
| JourneyDetailPage | ⬜ | ⬜ | ⬜ | |
| ProfilePage | ⬜ | ⬜ | ⬜ | |
| SaintsPage | ⬜ | ⬜ | ⬜ | |
| SearchResultsPage | ⬜ | ⬜ | ⬜ | |
| RitualPage | ⬜ | ⬜ | ⬜ | |
| ThemePage | ⬜ | ⬜ | ⬜ | |

**Legenda:** ✅ Aprovado · ⚠️ Aprovado com ressalvas · ❌ Reprovado · ⬜ Pendente

---

## 7. Checklist final pré-release

Antes de cada deploy em produção:

- [ ] Todos os componentes da seção 1 marcados como ✅ ou ⚠️ (com issues abertas)
- [ ] Nenhum ID duplicado em runtime (auditar com axe DevTools)
- [ ] `axe-core` sem violações `serious`/`critical` na categoria *ARIA*
- [ ] Lighthouse Accessibility ≥ 95 em todas as rotas auditadas
- [ ] Issues bloqueantes documentadas em `docs/a11y-known-issues.md`

---

## 8. Referências

- [WAI-ARIA Authoring Practices: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [NVDA User Guide — Browse vs Focus mode](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [Apple VoiceOver gestures](https://support.apple.com/guide/voiceover/gestures-cpvokys01/mac)
- Utilitário interno: `src/components/cathedra/TabUtils.tsx` (`useTabNavigation`, `getTabProps`, `getTabPanelProps`)
