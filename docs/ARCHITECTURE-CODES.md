# Arquitetura Oficial do Cathedra — v1.0

Padrão canônico de identificadores para toda a plataforma. Use estes códigos em ADRs, backlog, tickets, revisões, auditorias, commits e comunicação entre agentes.

**Regra:** cada domínio ocupa uma faixa exclusiva de numeração. Sem duplicidades. Sem sobreposição de responsabilidades.

---

## Macroarquitetura

```text
ARC-000 Fundação
│
├── ARC-100 Frontend
├── ARC-200 Backend
├── ARC-300 Banco de Dados
├── ARC-400 Bíblia Soberana
├── ARC-500 Segurança
├── ARC-600 Observabilidade
├── ARC-700 Performance
├── ARC-800 Inteligência Artificial
├── ARC-900 Infraestrutura
│
└── CAT-001 … CAT-015  (módulos funcionais)
```

---

## ARC-000 — Fundação

| Código  | Domínio             |
| ------- | ------------------- |
| ARC-000 | Arquitetura Mestre  |
| ARC-001 | Convenções          |
| ARC-002 | ADRs                |
| ARC-003 | Governança          |
| ARC-004 | Roadmap             |
| ARC-005 | Documentação        |

## ARC-100 — Frontend

| Código  | Domínio               |
| ------- | --------------------- |
| ARC-101 | React                 |
| ARC-102 | Componentes           |
| ARC-103 | Hooks                 |
| ARC-104 | Context               |
| ARC-105 | React Query           |
| ARC-106 | Roteamento            |
| ARC-107 | Design System         |
| ARC-108 | UI Tokens             |
| ARC-109 | Forms                 |
| ARC-110 | Performance Frontend  |

## ARC-200 — Backend

| Código  | Domínio           |
| ------- | ----------------- |
| ARC-201 | Edge Functions    |
| ARC-202 | Shared Libraries  |
| ARC-203 | Middleware        |
| ARC-204 | Zod Validation    |
| ARC-205 | Error Handling    |
| ARC-206 | Correlation ID    |
| ARC-207 | Rate Limit        |
| ARC-208 | HTTP Contracts    |
| ARC-209 | Cache             |
| ARC-210 | Workers           |

## ARC-300 — Banco de Dados

| Código  | Domínio         |
| ------- | --------------- |
| ARC-301 | PostgreSQL      |
| ARC-302 | Schema          |
| ARC-303 | Migrations      |
| ARC-304 | Índices         |
| ARC-305 | RPC             |
| ARC-306 | Triggers        |
| ARC-307 | RLS             |
| ARC-308 | Auditoria       |
| ARC-309 | Database Logs   |
| ARC-310 | Backup          |

## ARC-400 — Bíblia Soberana

| Código  | Domínio              |
| ------- | -------------------- |
| ARC-401 | Bíblia Soberana      |
| ARC-402 | Translation Sources  |
| ARC-403 | PCL                  |
| ARC-404 | Nexus                |
| ARC-405 | Catecismo            |
| ARC-406 | Magistério           |
| ARC-407 | Liturgia             |
| ARC-408 | Leituras             |
| ARC-409 | Conexões             |
| ARC-410 | Importação           |

## ARC-500 — Segurança

| Código  | Domínio           |
| ------- | ----------------- |
| ARC-501 | Authentication    |
| ARC-502 | Authorization     |
| ARC-503 | Admin             |
| ARC-504 | JWT               |
| ARC-505 | Security Definer  |
| ARC-506 | Secrets           |
| ARC-507 | CORS              |
| ARC-508 | Hardening         |
| ARC-509 | Compliance        |
| ARC-510 | LGPD              |

## ARC-600 — Observabilidade

| Código  | Domínio                  |
| ------- | ------------------------ |
| ARC-601 | Application Logs         |
| ARC-602 | Metrics                  |
| ARC-603 | Tracing                  |
| ARC-604 | Correlation Trail        |
| ARC-605 | Dashboards               |
| ARC-606 | Alerts                   |
| ARC-607 | Health Checks            |
| ARC-608 | Performance Monitoring   |
| ARC-609 | Audit Trail              |
| ARC-610 | Monitoring               |

## ARC-700 — Performance

| Código  | Domínio              |
| ------- | -------------------- |
| ARC-701 | Lazy Loading         |
| ARC-702 | Code Splitting       |
| ARC-703 | React.memo           |
| ARC-704 | Virtualização        |
| ARC-705 | Bundle Optimization  |
| ARC-706 | Prefetch             |
| ARC-707 | Cache HTTP           |
| ARC-708 | Service Worker       |
| ARC-709 | SQL Optimization     |
| ARC-710 | RPC Optimization     |

## ARC-800 — Inteligência Artificial

| Código  | Domínio              |
| ------- | -------------------- |
| ARC-801 | AI Gateway           |
| ARC-802 | Agentes              |
| ARC-803 | Prompt Engine        |
| ARC-804 | RAG                  |
| ARC-805 | Embeddings           |
| ARC-806 | LLM Providers        |
| ARC-807 | Voice AI             |
| ARC-808 | OCR                  |
| ARC-809 | Tradução Assistida   |
| ARC-810 | Automações           |

## ARC-900 — Infraestrutura

| Código  | Domínio            |
| ------- | ------------------ |
| ARC-901 | Supabase           |
| ARC-902 | Storage            |
| ARC-903 | CDN                |
| ARC-904 | Deploy             |
| ARC-905 | GitHub Actions     |
| ARC-906 | Docker             |
| ARC-907 | Ambiente           |
| ARC-908 | Backups            |
| ARC-909 | Disaster Recovery  |
| ARC-910 | Escalabilidade     |

---

## CAT — Módulos Funcionais

| Código   | Módulo         |
| -------- | -------------- |
| CAT-001  | Bíblia         |
| CAT-002  | Catecismo      |
| CAT-003  | Magistério     |
| CAT-004  | Liturgia       |
| CAT-005  | Lectio Divina  |
| CAT-006  | Nexus          |
| CAT-007  | Formação       |
| CAT-008  | Estudos        |
| CAT-009  | Perfil         |
| CAT-010  | Administração  |
| CAT-011  | PCL            |
| CAT-012  | Dashboard      |
| CAT-013  | Financeiro     |
| CAT-014  | Marketplace    |
| CAT-015  | IA             |

---

## Prefixos operacionais

Faixas abertas, numeração sequencial dentro de cada prefixo.

| Prefixo | Uso                          | Exemplo             |
| ------- | ---------------------------- | ------------------- |
| ADR-    | Architecture Decision Record | ADR-001 … ADR-999   |
| SPR-    | Sprint                       | SPR-001, SPR-002    |
| REV-    | Revisão                      | REV-001, REV-002    |
| AUD-    | Auditoria                    | AUD-001, AUD-002    |
| DB-     | Migração de banco            | DB-001, DB-002      |
| EF-     | Edge Function                | EF-001, EF-002      |
| RPC-    | RPC                          | RPC-001, RPC-002    |
| HK-     | Hook                         | HK-001, HK-002      |
| CMP-    | Componente                   | CMP-001, CMP-002    |

> Tickets funcionais reutilizam o prefixo `CAT-` do módulo correspondente.

---

## Como referenciar

Combine códigos para descrever o escopo real de um item:

- `ADR-012 → ARC-403` — decisão de arquitetura sobre PCL
- `CAT-004 → ARC-701 + ARC-703` — módulo Liturgia otimizado com lazy loading e memoization
- `SPR-B → ARC-709` — sprint focada em otimização SQL
- `Bug → ARC-206` — falha relacionada a Correlation ID
- `Refatoração → ARC-102` — refactor de componentes
- `Perf → ARC-710` — otimização de RPC

---

## Regras

1. **Faixa exclusiva por domínio.** Não criar códigos fora da faixa correspondente.
2. **Sem duplicidade.** Cada código aparece uma única vez nesta tabela.
3. **Sem renumeração.** Códigos aposentados permanecem reservados; novos itens usam o próximo número livre da faixa.
4. **Expansão.** Ao esgotar uma faixa (`ARC-N99`), abrir a próxima centena livre e registrar aqui antes de usar.
5. **Fonte da verdade.** Este documento é canônico. Qualquer divergência em ADR, ticket ou código-fonte é corrigida para bater com ele.

_Versão 1.0 — padrão oficial de arquitetura do Cathedra._
