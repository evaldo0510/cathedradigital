# Inventário de URLs de webhook do Mercado Pago

> 🔒 **BLOQUEIO ARQUITETURAL — CAT-DOC-002**
>
> Nenhuma alteração, renomeação, consolidação ou remoção das edge functions `mercadopago-webhook` e `mercado-pago-webhook` poderá ocorrer até que este inventário esteja **completo e validado** (seções 3.1–3.3 e 4 preenchidas).
>
> Violar este bloqueio = risco de desativar pagamentos em produção.

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

> ⚠️ Todos os campos abaixo devem ser preenchidos consultando **diretamente o painel do Mercado Pago**. Não inventar valores. Enquanto estiverem como `<preencher>`, o bloqueio arquitetural CAT-DOC-002 permanece ativo.

### 3.1 Aplicação Mercado Pago — PRODUÇÃO

- **Nome da aplicação no painel MP:** `<preencher>`
- **App ID:** `<preencher>`
- **Client ID (public):** `<preencher>`
- **Responsável pela consulta no painel MP:** `<preencher>`
- **Data da última validação:** `<preencher>` (formato: `AAAA-MM-DD`)
- **URL(s) de webhook cadastrada(s) no painel MP:**
  - [ ] `https://<PROJECT_REF>.supabase.co/functions/v1/mercado-pago-webhook`
  - [ ] `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`
  - [ ] outra (colar exata): `<preencher>`
- **Modo da URL registrada em `notification_url` (código):** `mercadopago-webhook` (ver `supabase/functions/mercadopago-create-preference/index.ts:254`)
- **Eventos assinados no painel MP:**
  - [ ] `payment`
  - [ ] `merchant_order`
  - [ ] `subscription_preapproval`
  - [ ] outros: `<preencher>`
- **Último recebimento bem-sucedido (data/hora + evento):** `<preencher>`
- **Fonte da evidência:** `<preencher>` (ex.: painel MP → Webhooks → Logs / tabela `public.webhook_logs`)

### 3.2 Aplicação Mercado Pago — SANDBOX (se separada)

- **Existe aplicação sandbox separada?** `<preencher>` (`sim` / `não` / `mesma aplicação com credenciais TEST-`)
- **Nome da aplicação no painel MP:** `<preencher>`
- **App ID:** `<preencher>`
- **Client ID (public):** `<preencher>`
- **Responsável pela consulta no painel MP:** `<preencher>`
- **Data da última validação:** `<preencher>`
- **URL(s) de webhook cadastrada(s):** `<preencher>`
- **Eventos assinados:** `<preencher>`
- **Último recebimento bem-sucedido:** `<preencher>`

### 3.3 Segredos vinculados

Confirmar quais estão configurados hoje em Lovable Cloud (Project Settings → Secrets). **Não colar valores dos segredos aqui** — apenas marcar presença/ausência.

- [ ] `MERCADO_PAGO_ACCESS_TOKEN` — presença: `<preencher>` (`sim` / `não`)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` — presença: `<preencher>`
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET` — presença: `<preencher>` (obrigatório para HMAC em `mercadopago-webhook`)
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` — presença: `<preencher>`
- [ ] outros relacionados: `<preencher>`
- **Responsável pela verificação dos secrets:** `<preencher>`
- **Data da verificação:** `<preencher>`

---

## 4. Decisão de consolidação (preencher depois do inventário)

- **Nome canônico escolhido:** `<preencher>` (`mercadopago-webhook` = padrão oficial MP; `mercado-pago-webhook` = mais legível pt-BR)
- **Função a manter:** `<preencher>`
- **Função a aposentar:** `<preencher>`
- **Plano de descomissionamento da aposentada:**
  - [ ] manter como stub `410 Gone` por 30 dias
  - [ ] deletar direto (só se painel MP nunca apontou pra ela)
- **Ação no painel MP:** trocar URL para o nome canônico **antes** de mexer no código.
- **Responsável pela decisão:** `<preencher>`
- **Data da decisão:** `<preencher>`

---

## 5. Checklist de execução (não iniciar antes de 1–4 estarem preenchidos)

1. [ ] Inventário 3.1–3.3 completo (sem `<preencher>` restantes nos campos obrigatórios)
2. [ ] URL canônica trocada no painel MP (produção e sandbox)
3. [ ] Aguardar 24h e confirmar recebimentos na função canônica (via `edge_function_logs`)
4. [ ] Só então: fundir código (HMAC + rate limit + testes) na função canônica
5. [ ] Atualizar referências internas: `supabase/functions/mercado-pago-retry/`, `supabase/functions/mercadopago-create-preference/`, `src/components/cathedra/UpgradePage.tsx`, docs
6. [ ] Deixar função aposentada como stub 410 por 30 dias
7. [ ] Após 30 dias sem tráfego: deletar via `delete_edge_functions`

---

## 6. Status do inventário

- **Status atual:** 🔴 **PENDENTE** — todos os campos sensíveis marcados como `<preencher>`.
- **Bloqueio CAT-DOC-002:** ativo até seções 3.1–3.3 e 4 estarem preenchidas.
- **Última atualização deste documento:** `<preencher>`
- **Preenchido por:** `<preencher>`

---

_Documento criado como pré-requisito de segurança. Não consolidar edge functions de pagamento sem completar as seções 3 e 4. Nenhum valor foi inventado — todos os campos não disponíveis estão marcados com `<preencher>`._
