# Plano de Padronização de Leitores — Fase 10.1A

Este plano visa unificar os leitores de Liturgia, Bíblia, Catecismo e Rosário seguindo o padrão editorial estabelecido pelo leitor de Santos (Sanctum). O objetivo é garantir consistência visual em Desktop (layout split-pane quando apropriado) e Mobile, integrando Nexus e ações de continuidade em todos os fluxos.

## 1. Padronização do Leitor de Liturgia
Migração do `LiturgiaPage.tsx` do `ContemplativeLayout` legado para a arquitetura `ReaderShell`.

- **Refatoração Estrutural**: Substituir o wrapper raiz por `ReaderShell`.
- **Hero Editorial**: Usar `EditorialHero` com kicker "Liturgia", título baseado na celebração do dia e subtítulo com a data formatada.
- **Contexto Litúrgico**: Injetar `LiturgicalContext` no slot `headerContext` com cor, tempo e grau da celebração.
- **Integração Nexus**: Mover o `NexusPanel` (atualmente fixo no final) para o slot `nexus` do shell.
- **Continuidade**: Mover `ReaderContinuation` para o slot `continuation`.
- **Refino de Conteúdo**: Manter os cards de leitura (`LiturgyReadingCard`, `LiturgyPsalmCard`) e meditação, mas garantir que o estilo de tipografia (`ReaderTypographyControl`) seja respeitado.

## 2. Padronização Desktop (Bíblia, Catecismo, Rosário)
Ajustar o layout dos leitores existentes para alinhar com a experiência Desktop de `SaintDetail.tsx`.

- **Bíblia (`BibleReader.tsx`)**:
  - Implementar o layout split-pane em Desktop: sidebar com a arte do livro (ou ícone sacro) e área de conteúdo editorial centrada.
  - Sincronizar `EditorialHero` com o estilo de Santos.
  - Garantir que `ReaderToolbar` seja o ponto único de controle (fonte, modo foco).

- **Catecismo (`Catechism.tsx`)**:
  - Aplicar o padrão `ReaderShell` + `EditorialHero` de forma consistente em Desktop.
  - Adicionar o slot `headerContext` usando `CatechesisContext` (já existente no arquivo, mas possivelmente desalinhado).
  - Unificar a navegação de rodapé via `EditorialClosure` + `ReaderContinuation`.

- **Rosário/Orações (`PrayerEngineReader.tsx`)**:
  - Validar e ajustar o `ReaderShell` para que em Desktop ele siga a densidade e o alinhamento centralizado do padrão Sanctum.
  - Garantir que o `PrayerContext` forneça as informações de "Passo" e "Mistério" de forma sóbria no slot `headerContext`.

## 3. Verificação de Dados (Auditoria)
- Executar testes automatizados via Playwright para confirmar que as leituras de Bíblia e Catecismo carregam corretamente em Desktop após as mudanças.
- Validar no dashboard de diagnósticos se as requisições de conteúdo estão completas e sem falhas de cache.

## Detalhes Técnicos
- Uso de `ReaderShell` como template master (COS §10).
- Composição via sub-componentes de `EditorialHero` (Eyebrow, Title, Subtitle, Meta).
- Persistência de tipografia via `useReaderTypography`.
- CSS semântico Harmony para garantir compatibilidade com temas Dark/Parchment.
