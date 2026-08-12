# Plano de Auditoria Funcional Real - CATHEDRA AUDIT 7.7.2

Este plano estabelece a transição da validação estrutural para a **Certificação Funcional Real**. O objetivo é garantir que as funcionalidades principais (Santos, Catecismo, Bíblia, Biblioteca, Orações e Nexus) não apenas existam em código, mas sejam utilizáveis de ponta a ponta pelo usuário final.

## 1. Critérios de Certificação (Novo Padrão)

*   **CERTIFIED:** O usuário consegue clicar, abrir, ler, navegar e concluir a ação sem erros.
*   **BLOCKED - BACKEND:** Estrutura existe, mas falha devido à indisponibilidade ou erro nos dados do banco de dados (Supabase).
*   **FAIL - FRONTEND:** Código e dados presentes, mas a interface impede ou dificulta a conclusão da ação (UX, bugs de UI, erros de navegação).

## 2. Áreas de Foco e Ações

### 2.1 Módulo de Santos (P0)
*   **Ação:** Validar fluxo `Lista -> Card -> Detalhe -> História Completa`.
*   **Verificação:** Confirmar que `SacredImage` carrega corretamente e o `Reader V2` renderiza a biografia sem quebras.

### 2.2 Catecismo & Bíblia (P0)
*   **Catecismo:** Testar navegação sequencial e por índice nos ~2.800 parágrafos.
*   **Bíblia:** Validar o seletor `Livro -> Capítulo` e a integração com o `BibleReader`.

### 2.3 Biblioteca & Acervo (P1)
*   **Ação:** Explorar as "Estantes Monásticas" e abrir itens da biblioteca.
*   **Verificação:** Garantir que o `nextPathEngine` sugere caminhos válidos.

### 2.4 Orações & Nexus (P1)
*   **Orações:** Verificar se o motor de orações recuperou a funcionalidade após as instabilidades de backend detectadas anteriormente.
*   **Nexus:** Validar se as conexões teológicas exibem as justificativas e mantêm o contraste/acessibilidade Harmony.

### 2.5 Performance & Multi-idioma (Transversal)
*   **Performance Mobile:** Medir LCP e TBT no carregamento inicial.
*   **Multi-idioma:** Testar trocas de idioma em páginas profundas (Reader/Santos) para evitar regressões.

## 3. Metodologia de Execução

1.  **Exploração via Playwright:** Uso de scripts para simular jornadas reais de usuário.
2.  **Diagnóstico Imediato:** Registro de logs detalhados no `InfrastructureDiagnosticsPage` para qualquer falha encontrada.
3.  **Relatório de Evidências:** Cada área receberá um selo específico baseado nos novos critérios de certificação.

## Detalhes Técnicos
*   Utilização do `ChurchContextEngine` para validar consistência de dados.
*   Monitoramento de eventos `supabase-unreachable` para distinção entre falhas de rede e lógica.
*   Validação de acessibilidade com `axe-core` integrado aos testes funcionais.
