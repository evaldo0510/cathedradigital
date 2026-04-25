# Checklist de Validação — Acessibilidade de Busca e Tags (Roving Tabindex)

Este documento descreve os critérios de acessibilidade e os roteiros de teste para os componentes `SearchResultCard` e as listas de tags interativas (Nexus, Temas, Global Search), garantindo conformidade com o padrão **Roving Tabindex** e **WAI-ARIA**.

---

## 1. Critérios de Acessibilidade

### 1.1 SearchResultCard (Cartão de Resultado)
- [ ] **Role**: Deve possuir `role="button"`.
- [ ] **Teclado**: Deve ser ativável com **Enter** e **Espaço**.
- [ ] **Foco**: Deve ter um `outline` ou `ring` visível ao receber foco via Tab.
- [ ] **Label**: Deve possuir `aria-label` concatenando título e subtítulo para contexto claro.
- [ ] **Anúncio**: Leitores de tela devem anunciar "Botão, [Título], [Subtítulo]".

### 1.2 Listas de Tags (Roving Tabindex)
- [ ] **Container**: Deve possuir `role="list"`.
- [ ] **Itens**: Devem possuir `role="listitem"` ou `role="button"` dependendo do contexto.
- [ ] **Navegação**: Apenas um item da lista deve ser focável por **Tab** (o item ativo).
- [ ] **Setas**: Navegação entre itens deve ser feita com **ArrowRight/Left** ou **ArrowUp/Down**.
- [ ] **Home/End**: **Home** deve levar ao primeiro item; **End** ao último.
- [ ] **Aria-pressed**: Tags selecionáveis (filtros) devem usar `aria-pressed="true|false"`.
- [ ] **Persistência de Foco**: Ao mudar filtros, o foco deve ser redefinido para o primeiro item de forma previsível.

---

## 2. Roteiro de Teste Manual (NVDA / VoiceOver)

### Cenário A: Navegação em Lista de Tags (Muitos itens)
1. Ative o leitor de tela.
2. Pressione **Tab** até chegar na primeira tag (ex: "Todos" em Temas).
3. Pressione **ArrowRight** repetidamente.
   - *Esperado*: O foco move para a próxima tag e o leitor anuncia o nome da tag.
4. Pressione **End**.
   - *Esperado*: O foco pula para a última tag da lista.
5. Pressione **Home**.
   - *Esperado*: O foco volta para a primeira tag.
6. Pressione **Enter** em uma tag.
   - *Esperado*: A tag é selecionada e o conteúdo abaixo é atualizado.

### Cenário B: Busca com Resultados
1. Digite um termo de busca (ex: "Amor").
2. Aguarde o carregamento (anúncio de "Buscando..." deve ser ouvido se houver `aria-live`).
3. Pressione **Tab** para entrar nos resultados.
4. Navegue pelos `SearchResultCard` usando **Tab**.
   - *Esperado*: Cada cartão recebe foco visual claro.
5. Pressione **Espaço** em um resultado.
   - *Esperado*: O link é seguido sem conflito com animações de entrada.

### Cenário C: Resultados Vazios
1. Digite um termo sem resultados (ex: "xyz123").
2. Pressione **Tab**.
   - *Esperado*: O foco deve pular a área de resultados e ir para o próximo elemento sem "ficar preso" em containers vazios.

---

## 3. Validação Técnica de Atributos

### IDs e Referências
- [ ] Verificar que IDs de abas (`tab-X`) não colidem com IDs de tags se estiverem na mesma página.
- [ ] Garantir que `aria-controls` aponte para um ID que realmente existe.
- [ ] Atributos `data-roving-item` devem estar presentes para o hook `useRovingTabindex` funcionar.

### Performance e Animações
- [ ] Confirmar que `framer-motion` não usa `pointer-events: none` durante a animação de forma que impeça o clique imediato.
- [ ] O hook `useRovingTabindex` usa `setTimeout(..., 0)` para garantir que o DOM esteja pronto antes do `.focus()`.

---

## 4. Registro de Testes

| Componente/Página | Ferramenta | Resultado | Notas |
|-------------------|------------|-----------|-------|
| Temas (Tags) | NVDA | ⬜ | |
| Global Search | VoiceOver | ⬜ | |
| Nexus Bubbles | TalkBack | ⬜ | |
| Saints Search | NVDA | ⬜ | |
