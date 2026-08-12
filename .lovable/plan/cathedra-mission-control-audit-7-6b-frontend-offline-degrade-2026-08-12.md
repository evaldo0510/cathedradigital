# CATHEDRA MISSION CONTROL — AUDIT 7.6B: FRONTEND OFFLINE / DEGRADED MODE

## 1. OBJETIVO
Garantir que o Cathedra permaneça funcional, confiável e editorialmente íntegro mesmo quando o backend (Supabase/Edge Functions) estiver indisponível.

## 2. DIAGNÓSTICO ATUAL (BLOCKED — BACKEND DEPENDENCY)
- **Causa Raiz**: Erros `TypeError: Failed to fetch` e `Tenant not found` no sandbox impedem a comunicação com o banco.
- **Sintoma P0**: Skeletons infinitos no Acervo, Bíblia bloqueada por manutenção e Nexus vazio sem explicação.
- **Falha de UX**: O sistema não distingue consistentemente `EMPTY` (não existe dado) de `OFFLINE` (servidor inalcançável).

## 3. PLANO DE AÇÃO (REMEDIATION)

### FRENTE 1: SINALIZAÇÃO GLOBAL (STATUS: P0)
- **Centralização do Erro**: Refatorar `supabase/client.ts` para disparar o evento `supabase-unreachable` em qualquer falha de fetch.
- **OfflineIndicator**: Garantir visibilidade e persistência do estado offline na UI.

### FRENTE 2: RESILIÊNCIA NO ACERVO E BIBLIOTECA (STATUS: P0)
- **AcervoHomePage**: Implementar tratamento de erro nas queries iniciais. Se falhar, exibir `LibraryOfflineFallback` em vez de skeletons.
- **libraryService**: Adicionar try/catch com propagação de erro semântico.

### FRENTE 3: CATECISMO E BÍBLIA (STATUS: P1)
- **BibleReadGate**: Refinar o estado `blocked`. Se for falha de conexão, a UI deve sugerir "Tentar Novamente" e não apenas informar manutenção.
- **Catechism**: Corrigir o fallback para garantir que parágrafos em cache no IndexedDB continuem abrindo mesmo com erro de rede no poll.

### FRENTE 4: NEXUS E CONTEMPLAÇÃO (STATUS: P2)
- **NexusPanel**: Exibir "Conexões temporariamente indisponíveis" em vez de uma lista vazia fria.
- **Liturgy**: Assegurar que os fallbacks locais (RailwayInAdiutorium) assumam o controle imediatamente.

## 4. DEFINIÇÃO DE PRONTO (DoR)
- [ ] Nenhum skeleton infinito em caso de erro 500/Network.
- [ ] Mensagens de erro distinguem claramente "Indisponível" de "Não Encontrado".
- [ ] Botão "Tentar Novamente" presente em todos os módulos críticos.
- [ ] O usuário consegue ler conteúdos em cache (Bíblia/CIC) mesmo offline.

**STATUS ATUAL: AUDIT 7.6B — EXECUTION IN PROGRESS**
