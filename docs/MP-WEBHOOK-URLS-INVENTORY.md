# Inventário de URLs de webhook do Mercado Pago

Pré-requisito para consolidar `mercado-pago-webhook` ↔ `mercadopago-webhook` sem desativar pagamentos em produção. **Preencher antes de qualquer mudança nas edge functions.**

Códigos relacionados: `ARC-403` (PCL), `CAT-013` (Financeiro), `ARC-501/509` (Segurança/Compliance).

---

## 1. Onde consultar no painel do Mercado Pago

Painel MP → **Suas integrações** → selecionar a aplicação → **Webhooks** (ou **Notificações**).

Anotar para **cada aplicação** cadastrada (produção e sandbox, se separadas).

---

## 2. URLs candidatas neste projeto

As duas edge functions que existem hoje geram estas URLs públicas:

| Função (nome no repo)     | URL pública (padrão Lovable Cloud)                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `mercado-pago-webhook`    | `https://<PROJECT_REF>.supabase.co/functions/v1/mercado-pago-webhook`                  |
| `mercadopago-webhook`     | `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`                   |

> Substituir `<PROJECT_REF>` pelo ref real do projeto (visível no `.env` como `VITE_SUPABASE_URL`).

---

## 3. Preencher

### 3.1 Aplicação Mercado Pago — PRODUÇÃO

- **Nome da aplicação no painel MP:** `_________`
- **App ID:** `_________`
- **URL(s) de webhook cadastrada(s):**
  - [ ] `.../functions/v1/mercado-pago-webhook`
  - [ ] `.../functions/v1/mercadopago-webhook`
  - [ ] outra (colar exata): `_________`
- **Eventos assinados:** `payment` / `merchant_order` / outros: `_________`
- **Último recebimento bem-sucedido:** `_________` (data/hora ou "não sei")

### 3.2 Aplicação Mercado Pago — SANDBOX (se separada)

- **Nome:** `_________`
- **App ID:** `_________`
- **URL(s):** `_________`
- **Eventos:** `_________`

### 3.3 Segredos vinculados

Confirmar quais estão configurados hoje em Lovable Cloud (Project Settings → Secrets):

- [ ] `MERCADO_PAGO_ACCESS_TOKEN`
- [ ] `MERCADOPAGO_ACCESS_TOKEN`
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET`  ← obrigatório para verificação HMAC em `mercadopago-webhook`
- [ ] outros: `_________`

---

## 4. Decisão de consolidação (preencher depois do inventário)

- **Nome canônico escolhido:** `_________` (`mercadopago-webhook` = padrão oficial MP; `mercado-pago-webhook` = mais legível pt-BR)
- **Função a manter:** `_________`
- **Função a aposentar:** `_________`
- **Plano de descomissionamento da aposentada:**
  - [ ] manter como stub `410 Gone` por 30 dias
  - [ ] deletar direto (só se painel MP nunca apontou pra ela)
- **Ação no painel MP:** trocar URL para o nome canônico **antes** de mexer no código.

---

## 5. Checklist de execução (não iniciar antes de 1–4 estarem preenchidos)

1. [ ] Inventário 3.1–3.3 completo
2. [ ] URL canônica trocada no painel MP (produção e sandbox)
3. [ ] Aguardar 24h e confirmar recebimentos na função canônica (via `edge_function_logs`)
4. [ ] Só então: fundir código (HMAC + rate limit + testes) na função canônica
5. [ ] Atualizar referências internas: `supabase/functions/mercado-pago-retry/`, `supabase/functions/mercadopago-create-preference/`, `src/components/cathedra/UpgradePage.tsx`, docs
6. [ ] Deixar função aposentada como stub 410 por 30 dias
7. [ ] Após 30 dias sem tráfego: deletar via `delete_edge_functions`

---

_Documento criado como pré-requisito de segurança. Não consolidar edge functions de pagamento sem completar as seções 3 e 4._
