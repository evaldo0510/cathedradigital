# ARCHITECTURE.md — Visão geral

Escopo: ARC-000 (Fundação).

## Estado atual

**Cathedra** é uma plataforma católica web/mobile com foco em Bíblia soberana, catecismo, magistério, liturgia, lectio divina e formação, sustentada por IA controlada.

### Stack

| Camada          | Tecnologia                                                    | Código  |
| --------------- | ------------------------------------------------------------- | ------- |
| Frontend        | React 18 + Vite 5 + TypeScript 5 + Tailwind v3 + shadcn/ui    | ARC-101 |
| State/data      | `@tanstack/react-query`                                       | ARC-105 |
| Roteamento      | React Router (rotas em `src/App.tsx` + `src/pages/**`)        | ARC-106 |
| Backend         | Deno Edge Functions (Lovable Cloud / Supabase)                | ARC-201 |
| Banco           | PostgreSQL gerenciado (Lovable Cloud)                         | ARC-301 |
| Autenticação    | Supabase Auth                                                 | ARC-501 |
| Mobile          | Capacitor (`capacitor.config.ts`)                             | ARC-904 |
| CI/CD           | GitHub Actions (`.github/workflows/**`)                       | ARC-905 |
| IA              | Lovable AI Gateway                                            | ARC-801 |

### Macroarquitetura

```text
ARC-000 Fundação
├── ARC-100 Frontend        (React/Vite/Tailwind)
├── ARC-200 Backend         (Edge Functions)
├── ARC-300 Banco           (PostgreSQL + RLS)
├── ARC-400 Bíblia Soberana (domínio central)
├── ARC-500 Segurança
├── ARC-600 Observabilidade
├── ARC-700 Performance
├── ARC-800 IA
├── ARC-900 Infraestrutura
└── CAT-001…CAT-015         (módulos funcionais)
```

Detalhe da taxonomia: [`../ARCHITECTURE-CODES.md`](../ARCHITECTURE-CODES.md).
Mapeamento código → arquivos reais: [`../ARC-MAP.md`](../ARC-MAP.md).

### Números de referência (snapshot)

- **Edge functions:** 55 (inclui `_shared` e `tests`), ver [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md).
- **Tabelas `public`:** ~120, ver [DATABASE.md](./DATABASE.md).
- **Workflows CI:** ~25 em `.github/workflows/`.

## Princípios inegociáveis

1. **Soberania de dados** — banco local (Bíblia, catecismo, magistério) é a fonte da verdade; fontes externas são fallback.
2. **Mobile first** — todo componente é validado em viewport mobile antes de desktop.
3. **Performance** — alvo ≤200ms em render principal e ≤100ms em busca.
4. **Simplicidade** — nova dependência só entra se melhorar UX de forma mensurável.
5. **Experiência espiritual acima da tecnologia** — telemetria, popovers e telas de erro não podem quebrar contexto de leitura/oração.

## Estado homologado

- Taxonomia ARC/CAT ([`ARCHITECTURE-CODES.md`](../ARCHITECTURE-CODES.md)) é oficial e canônica.
- Mapa código → arquivos ([`ARC-MAP.md`](../ARC-MAP.md)) é fonte de verdade da localização real.
- Estrutura de diretórios do `src/` é a documentada em `ARCHITECTURE-CODES.md#estrutura-de-diretórios--src` (snapshot atual).

## Dívida técnica

- **ADRs 001–010 mencionados mas ausentes** — nenhum arquivo `ADR-*.md` existe em `docs/`. Criar ADRs retroativos após o evento para decisões já tomadas (taxonomia ARC, PCL, sanidade de webhook MP, etc.).
- **Duplicação Mercado Pago** — coexistem `mercado-pago-webhook` e `mercadopago-webhook` com implementações divergentes. Ver [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md#duplicações).
- **Faixas ARC reservadas sem implementação** — ARC-207, ARC-310, ARC-805, ARC-808, ARC-906, CAT-014.
- **Inventário de webhooks MP não preenchido** — `docs/MP-WEBHOOK-URLS-INVENTORY.md` está em branco.

## Propostas pós-evento

Registradas sem autorização de execução. Cada uma exige ADR próprio.

- **Proposta A** — Modularização do `src/` por domínio (`modules/*`).
- **Proposta B** — Consolidação de edge functions por grupo (`bible/`, `pcl/`, `payments/`, `admin/`).
- **Proposta C** — Migração de tabelas com prefixo `bible_*` para schema `bible.*`.
- **Proposta D** — Refactor do frontend após estabilização.
- **Proposta E** — Criação retroativa de ADRs 001–010.
