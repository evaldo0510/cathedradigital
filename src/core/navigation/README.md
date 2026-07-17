# src/core/navigation — Contratos Globais do Cathedra 2.0

Sprint 2.0.3A. Espinha dorsal compartilhada por todos os ambientes.

## Regra de ouro

Este diretório **é infra de contrato**. Não pode:

- importar de nenhum ambiente (`src/modules/*`)
- importar de UI, React, componentes, rotas concretas
- conhecer Supabase, fetch, React Query, Edge Functions

Ambientes **consomem** os registries. Registries **não conhecem** ambientes.

## Os quatro registries

| Registry              | Responde a                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `EnvironmentRegistry` | Quais são os 5 ambientes canônicos e seus metadados              |
| `RouteRegistry`       | Rota canônica de cada destino (nunca hardcode `/estudar/...`)    |
| `ThemeRegistry`       | Temas e seu **Estudo Composto** (Bíblia→Catecismo→…→Oração)      |
| `SearchRegistry`      | Resultados tipados (`kind`) com ação (`open-reader`, etc.)       |

## Fase atual

Contratos + mocks estáticos. Nenhuma origem externa.
Na Sprint 2.0.6 (integração), as implementações mock são trocadas por adapters de dados reais **sem alterar consumidores**.
