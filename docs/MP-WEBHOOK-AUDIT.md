# Auditoria — Webhooks Mercado Pago

**Sprint:** R1 · Fase R1.2.1
**Data:** 2026-07-16
**Escopo:** apenas leitura. Nenhum arquivo alterado, nenhuma função removida.
**Objetivo:** determinar qual dos dois endpoints (`mercado-pago-webhook` com hífen vs. `mercadopago-webhook` sem hífen) é canônico e se algum pode ser arquivado.

---

## TL;DR

**Nenhum dos dois é código morto.** Os dois estão vivos, com responsabilidades diferentes:

| Endpoint | Papel real | Ativo | Ação recomendada |
|---|---|---|---|
| `mercadopago-webhook` (sem hífen) | Endpoint público chamado **pelo Mercado Pago** em produção (URL registrada em `notification_url`) | ✅ | **Manter. Não tocar nesta sprint.** |
| `mercado-pago-webhook` (com hífen) | Endpoint **interno** — usado por `UpgradePage` (polling/simulação) e pelo worker `mercado-pago-retry`; possui idempotência via `webhook_logs`, HMAC, retry e rate limit | ✅ | **Manter.** Renomear/consolidar exige plano dedicado (fora do escopo Onda 1). |

Recomendação: **remover o item "webhook duplicado" da meta da Onda 1** e substituir por uma tarefa de _documentação de fronteira_ (quem chama o quê). A consolidação real fica adiada para uma sprint futura, com migração planejada do `notification_url` no painel do Mercado Pago.

---

## 1. Inventário

### 1.1 Diretórios
```
supabase/functions/
├── mercado-pago-webhook/      # 289 linhas — internal + retry
│   ├── index.ts
│   ├── webhook_test.ts
│   ├── retry_test.ts
│   ├── robustness_test.ts
│   └── final_robustness.test.ts
├── mercado-pago-retry/        # worker que reprocessa webhook_logs pendentes
├── mercadopago-webhook/       # 270 linhas — endpoint público MP
│   └── index.ts
├── mercadopago-create-preference/
├── mercadopago-simulate/
└── mercadopago-sync-payment/
```

### 1.2 Configuração
- `supabase/config.toml`: **não declara nenhum dos dois** (ambos herdam `verify_jwt = true` por padrão do runtime Supabase, mas na prática recebem POSTs sem JWT do MP — a validação real é feita pela assinatura HMAC dentro do código).
- Nenhuma referência a `[functions.mercado-pago-webhook]` ou `[functions.mercadopago-webhook]`.

---

## 2. Rastreio de chamadas (grep em todo o repo)

### 2.1 `mercadopago-webhook` (sem hífen) — endpoint público MP
| Origem | Arquivo | Linha | Uso |
|---|---|---|---|
| **Mercado Pago (externo)** | `supabase/functions/mercadopago-create-preference/index.ts` | 254 | `notification_url: ${supabaseUrl}/functions/v1/mercadopago-webhook` — **URL registrada em cada preferência de pagamento** |
| Testes CID | `supabase/functions/tests/cid_*` | — | smoke tests CORS/headers |

**Conclusão:** este é o webhook que o MP realmente chama em produção. Alterar o nome quebra pagamentos até o `notification_url` ser reemitido em todas as preferências novas — e preferências antigas continuam apontando para o nome atual.

### 2.2 `mercado-pago-webhook` (com hífen) — endpoint interno
| Origem | Arquivo | Linha | Uso |
|---|---|---|---|
| Frontend polling | `src/components/cathedra/UpgradePage.tsx` | 315, 376 | Confirmação manual/polling de pagamento pelo próprio cliente |
| Retry worker | `supabase/functions/mercado-pago-retry/index.ts` | 86 | Reprocessa `webhook_logs` com `status=failed`/`pending` |
| Testes E2E | `supabase/functions/tests/mercadopago_robustness_test.ts` | 14, 67 | Testes de idempotência e retry |
| Testes locais | `supabase/functions/mercado-pago-webhook/*_test.ts` | — | Suite dedicada |

**Conclusão:** este endpoint é a “camada resiliente” do sistema — o único que:
- grava em `webhook_logs` (48 `payment.updated` + 20 `payment.created` nos últimos registros — tráfego real)
- suporta `x-is-retry` / `x-retry-log-id` para o worker
- suporta `x-simulate-*` para testes
- tem rate limit por IP

Removê-lo derruba: polling do frontend, worker de retry, suite de testes de robustez e o histórico de idempotência.

---

## 3. Evidência de tráfego (`public.webhook_logs`)

```sql
select provider, event_type, count(*), min(created_at), max(created_at)
  from webhook_logs group by 1,2;
```

| provider | event_type | count | first | last |
|---|---|---:|---|---|
| mercado_pago | payment.updated | 48 | 2026-06-04 15:32 | 2026-06-04 16:31 |
| mercado_pago | payment.created | 20 | 2026-06-04 15:32 | 2026-06-05 00:46 |

**Escritor:** apenas `mercado-pago-webhook` (com hífen) escreve nesta tabela. O endpoint sem hífen atualiza `transactions` e `profiles` diretamente e **não** deixa rastro em `webhook_logs` — os dois têm modelos de observabilidade divergentes.

Logs de edge functions (`function_edge_logs`) não têm retenção suficiente no ambiente para triangular a origem dos POSTs por função nos últimos 30 dias.

---

## 4. Diferenças funcionais dos dois handlers

| Recurso | `mercadopago-webhook` (sem hífen) | `mercado-pago-webhook` (com hífen) |
|---|:-:|:-:|
| Endpoint público MP (`notification_url`) | ✅ | ❌ |
| Chamado por `UpgradePage` (polling) | ❌ | ✅ |
| Chamado por `mercado-pago-retry` | ❌ | ✅ |
| Validação HMAC (`x-signature`) | ✅ | ✅ |
| Rate limit por IP | ❌ | ✅ |
| Persistência em `webhook_logs` (idempotência) | ❌ | ✅ |
| Suporte a `x-is-retry` / retry worker | ❌ | ✅ |
| Suporte a `x-simulate-*` (testes) | ❌ | ✅ |
| Atualiza `transactions` / `profiles.is_premium` | ✅ | ✅ (via lógica própria) |
| Envia notificações | ✅ | ✅ |
| CID / envelope Sprint A | ✅ | ✅ |
| Tamanho | 270 linhas | 289 linhas |

**Sobreposição real:** ~40% (parsing MP, atualização de `transactions`, ativação PRO, notificações). O restante é responsabilidade exclusiva de cada um.

---

## 5. Riscos de consolidação prematura

1. **Quebra de pagamentos em produção:** o `notification_url` em preferências já criadas aponta para `mercadopago-webhook`. Renomear/remover essa função para a versão “canônica” invalida callbacks de pagamentos em andamento.
2. **Perda de idempotência:** o endpoint público não usa `webhook_logs`. Consolidar sem migrar a lógica de log/retry deixa o sistema sem rastreabilidade.
3. **Quebra do polling do frontend:** `UpgradePage` chama explicitamente `mercado-pago-webhook` via `supabase.functions.invoke`. Mudança de nome exige deploy coordenado.
4. **Quebra do worker `mercado-pago-retry`:** referência hard-coded.
5. **Quebra dos testes:** 4 arquivos de teste no diretório do webhook interno + 1 em `tests/` (`mercadopago_robustness_test.ts`).

---

## 6. Decisão recomendada para a Onda 1

### 6.1 Não arquivar nenhum dos dois nesta sprint.

Substituir a meta original:

> ~~“Webhooks Mercado Pago: 2 → 1 ativo + 1 removido”~~

por:

> **“Webhooks Mercado Pago: 2 endpoints documentados com fronteira clara, sem alteração de código.”**

### 6.2 Entregável desta fase
- ✅ Este relatório (`docs/MP-WEBHOOK-AUDIT.md`).

### 6.3 Backlog para uma sprint futura (Onda 2 ou dedicada)
Plano de consolidação, **com janela de manutenção**:
1. Extrair núcleo comum para `supabase/functions/_shared/mercadopago-core.ts` (validação HMAC, resolução de token, atualização de `transactions`, ativação PRO, notificações).
2. Manter `mercadopago-webhook` como thin wrapper do core (endpoint MP).
3. Manter `mercado-pago-webhook` como thin wrapper do core + camada resiliente (`webhook_logs`, retry, simulate, rate limit).
4. Após 1 ciclo de estabilidade, avaliar se `mercadopago-webhook` deve **também** passar a gravar `webhook_logs` (uniformizar observabilidade) — e só depois discutir remoção de um dos dois.
5. Qualquer remoção exige: reemitir todas as preferências pendentes ou manter alias por 30 dias.

Meta pós-consolidação (não desta sprint):

| Métrica | Antes | Meta futura |
|---|---:|---:|
| Linhas totais (2 handlers) | 559 | ~350 (com core compartilhado) |
| Duplicação de lógica MP | ~40% | 0% |
| Endpoints ativos | 2 | 2 (mas thin) |

---

## 7. Referências
- `docs/BLOCK-OPTIMIZATION-REPORT.md` — auditoria R1.1
- `REPORTS/sprint-zero-02-edge-functions.md` — flag inicial de “duplicata”
- `docs/EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX.md` — exceção compartilhada dos dois
- `docs/SPRINT-A-FINAL-REPORT.md` — categoria “integrações externas com contrato fixo”

---

**Status da Fase R1.2.1:** ✅ concluída — pronto para avançar à **R1.2.2 (Bible.tsx)** sem mexer nos webhooks.
