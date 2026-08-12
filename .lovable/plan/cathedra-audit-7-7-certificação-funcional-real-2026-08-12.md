# CATHEDRA AUDIT 7.7 — CERTIFICAÇÃO FUNCIONAL REAL

## Objetivo
Implementar o painel de auditoria 7.7 e a infraestrutura de testes e2e para validar a jornada do peregrino em Catecismo, Bíblia e Santos.

## Front-end (Admin)
- Criar `src/pages/admin/Audit77Dashboard.tsx`: Painel com checklist visual por módulo (P0/P1/P2).
- Exibir status: `PASS`, `FAIL`, `BLOCKED` (apenas se backend falhar comprovadamente).
- Integrar captura de evidências: logs de console, erros de rede e screenshots (via telemetria).
- Botão para exportação do Relatório Final em JSON/PDF.

## Infraestrutura de Testes (Playwright)
- Criar `tests/audit77/catechism.spec.ts`: Fluxo abertura -> parágrafo -> Reader V2 -> Nexus.
- Criar `tests/audit77/bible.spec.ts`: Fluxo livro -> capítulo -> Reader -> Nexus.
- Criar `tests/audit77/saints.spec.ts`: Fluxo lista -> detalhe completo -> Reader.
- Implementar classe `AuditReporter` para consolidar evidências e métricas de LCP/requests.

## Segurança e Resiliência
- Refinar lógica de fallbacks: Não mascarar ausência de dados; exibir `BLOCKED` explicitamente se for erro de conexão.
- Assegurar que `supabase-unreachable` dispare o status `BLOCKED` no dashboard.

## Detalhes Técnicos
- O painel administrativo usará componentes Harmony já existentes.
- A suíte de testes será integrada ao CI/CD para evitar regressões na jornada crítica.
