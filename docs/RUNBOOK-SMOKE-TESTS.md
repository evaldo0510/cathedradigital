# Runbook — Smoke Tests (Sprint S0)

**Objetivo:** validar comportamento do sistema **sem alterar código**, cobrindo os fluxos críticos antes do evento.

**Escopo:** ambiente de produção (`https://cathedradigital.com.br`) e, quando indicado, sandbox.

**Regras:**

- Todos os testes são **read-only** ou usam contas dedicadas de teste (nunca dados reais de usuários).
- Testes de pagamento **apenas em sandbox do Mercado Pago**. Nunca cobrar cartão real.
- Cada teste tem **critério objetivo de sucesso**. Sem critério cumprido = FALHA.
- Registrar evidência (screenshot ou anotação) para cada teste executado.
- Executar todo o runbook em **desktop (1280px)** e **mobile (viewport 375px)**.

**Responsável pela execução:** `<preencher>` (QA)
**Data de execução:** `<preencher>`
**Ambiente:** `<preencher>` (produção / sandbox)
**Commit SHA em teste:** `<preencher>`

---

## Preparação

1. Abrir navegador em modo anônimo (evita cache/sessão contaminada).
2. Abrir DevTools:
   - **Console:** filtrar por `error` — nenhum erro vermelho aceito nos fluxos abaixo.
   - **Network:** filtrar por `status-code:>=400` — nenhuma requisição 4xx/5xx nos fluxos abaixo (exceto 401/403 esperados).
3. Ter em mãos:
   - Usuário de teste: `<preencher>` (email + senha)
   - Usuário PRO de teste: `<preencher>`
   - Cartão de teste MP sandbox: `<preencher>` (ver docs oficiais MP)

---

## SM-01 — Login / Logout

**Passos:**
1. Acessar `/auth` (ou botão "Entrar" no header).
2. Fazer login com usuário de teste.
3. Confirmar redirecionamento para home autenticada.
4. Clicar em logout.
5. Confirmar retorno à home pública.

**Critério de sucesso:**
- ✅ Login redireciona em < 2s
- ✅ Header muda para estado autenticado (avatar/nome visível)
- ✅ Logout limpa sessão (refresh manual não recupera estado logado)
- ✅ Nenhum erro no console
- ✅ Nenhum 4xx/5xx em `/auth/v1/token` além de tentativas com senha errada

---

## SM-02 — Leitura da Bíblia

**Passos:**
1. Ir para `/biblia`.
2. Selecionar livro **Gênesis**, capítulo **1**.
3. Aguardar carregamento completo.
4. Rolar até o versículo 31.
5. Trocar para capítulo **50**.

**Critério de sucesso:**
- ✅ Renderização inicial do capítulo < **200ms** (medir em DevTools → Performance ou Network TTFB)
- ✅ Todos os versículos 1–31 visíveis
- ✅ Navegação para cap 50 < 200ms
- ✅ Nenhum erro de console
- ✅ Fonte, contraste e espaçamento consistentes com design system

---

## SM-03 — Busca Bíblica

**Passos:**
1. Em `/biblia`, abrir busca.
2. Buscar por: `amor` (termo com muitos resultados).
3. Buscar por: `Jerusalém` (termo com acento).
4. Buscar por: `xyznaoexiste` (termo sem resultado).

**Critério de sucesso:**
- ✅ Cada busca retorna em < **100ms**
- ✅ Resultados de "amor" incluem 1 Coríntios 13
- ✅ Resultados de "Jerusalém" respeitam acento (não retorna vazio)
- ✅ Busca sem resultado exibe mensagem de vazio (não crasha)
- ✅ Nenhum erro de console

---

## SM-04 — Nexus (Referência Cruzada)

**Passos:**
1. Abrir um versículo com referências cruzadas conhecidas (ex.: **João 3:16**).
2. Clicar em uma referência cruzada (popover).
3. Fechar popover.
4. Voltar ao contexto original (sem perder posição de leitura).

**Critério de sucesso:**
- ✅ Popover abre em < **150ms**
- ✅ Popover exibe conteúdo da referência
- ✅ Fechar popover **não** perde a posição de scroll do texto original
- ✅ Popover fecha ao clicar fora / tecla ESC
- ✅ Funciona em mobile (não ocupa 100% da tela abruptamente)

---

## SM-05 — Magisterium

**Passos:**
1. Ir para `/magisterium`.
2. Filtrar categoria **Constituições Apostólicas**.
3. Abrir um documento.
4. Rolar até o final.

**Critério de sucesso:**
- ✅ Lista carrega em < 500ms
- ✅ Filtro por categoria atualiza URL (`?cat=...`) e persiste no refresh
- ✅ Documento abre com hierarquia (parágrafos, notas de rodapé) preservada
- ✅ Nenhum erro de console
- ✅ Links internos (referências vaticanas) abrem em nova aba

---

## SM-06 — Liturgia do Dia

**Passos:**
1. Ir para `/liturgia` (ou seção equivalente).
2. Comparar dados exibidos (tempo litúrgico, cor, santo do dia) com <https://www.vaticannews.va/pt/palavra-do-dia.html> ou fonte oficial equivalente.

**Critério de sucesso:**
- ✅ Data exibida = data local do usuário
- ✅ Tempo litúrgico coerente com calendário oficial
- ✅ Cor litúrgica correta
- ✅ Leituras do dia batem com a fonte de referência
- ✅ Cálculo Computus para próxima Páscoa correto (verificar `2027-03-28`)

---

## SM-07 — Checkout Mercado Pago (SANDBOX APENAS)

⚠️ **NUNCA executar com cartão real. Usar exclusivamente sandbox MP.**

**Passos:**
1. Login com usuário de teste **não-PRO**.
2. Ir para página de upgrade.
3. Selecionar plano PRO.
4. Ser redirecionado para checkout MP sandbox.
5. Preencher cartão de teste MP.
6. Concluir pagamento.
7. Aguardar até 60s pela ativação do PRO.
8. Verificar em Lovable Cloud Logs → `mercadopago-webhook`: recebimento e processamento.

**Critério de sucesso:**
- ✅ Preferência gerada (endpoint `mercadopago-create-preference` retorna 200)
- ✅ Checkout MP carrega
- ✅ Após pagamento, webhook é recebido em `mercadopago-webhook` **ou** `mercado-pago-webhook` (registrar qual)
- ✅ Status do usuário muda para PRO em < 60s
- ✅ `external_reference` no log confere com o `user_id` do teste
- ✅ Nenhum erro 5xx no webhook

**Registrar:** qual das duas edge functions recebeu o webhook (dado crítico para o inventário CAT-DOC-002).

---

## SM-08 — Logos AI (usuário free)

**Passos:**
1. Login com usuário free.
2. Enviar 1 pergunta ao Logos.
3. Verificar formato da resposta (3 partes: Fundamento, Meditação, Aplicação).
4. Repetir até atingir o limite diário (5 msgs).
5. Enviar 6ª mensagem.

**Critério de sucesso:**
- ✅ Resposta chega em < 10s
- ✅ Resposta tem as 3 partes estruturadas
- ✅ Contador de uso decrementa corretamente
- ✅ 6ª mensagem é **bloqueada** com mensagem clara (não crash)
- ✅ Nenhum erro de console
- ✅ Nenhum vazamento de chave de API em Network ou Console

---

## SM-09 — Mobile (viewport 375px)

Repetir **SM-01, SM-02, SM-04, SM-05, SM-07** em viewport 375×667 (iPhone SE) ou dispositivo real.

**Critério de sucesso:**
- ✅ Nenhum overflow horizontal (`document.documentElement.scrollWidth` == viewport width)
- ✅ Toques (tap) funcionam em todos os elementos interativos (min 44×44px)
- ✅ Popovers, modais e drawers cabem na tela
- ✅ Fontes legíveis (mínimo 14px para corpo de texto)
- ✅ Header/footer não ocultam conteúdo crítico

---

## SM-10 — Acessibilidade básica

**Passos:**
1. Em uma página representativa (ex.: `/biblia`), navegar **apenas com teclado** (Tab, Shift+Tab, Enter, ESC).
2. Verificar contraste com DevTools → Lighthouse → Accessibility.
3. Verificar `alt` em imagens críticas.

**Critério de sucesso:**
- ✅ Foco visível em todos os elementos interativos
- ✅ Ordem de tab é lógica
- ✅ Score de Acessibilidade no Lighthouse ≥ 90
- ✅ Nenhuma imagem sem `alt` (exceto decorativas com `alt=""`)

---

## SM-11 — Logs & Erros silenciosos

**Passos:**
1. Após executar SM-01 a SM-10, revisar:
   - Lovable Cloud Logs → últimos 60min de todas as edge functions chamadas
   - Console do navegador com histórico completo
   - Network com filtro `status-code:>=400`

**Critério de sucesso:**
- ✅ Nenhum erro 5xx em edge functions
- ✅ Nenhum warning de React repetido (key duplicada, hook fora de ordem, etc.)
- ✅ Nenhuma requisição pendente/travada
- ✅ Nenhum secret vazado em respostas (grep por `sk-`, `Bearer `, `SUPABASE_SERVICE`)

---

## Critério global de sucesso do runbook

O runbook está **aprovado** para liberar a tag `v1.0-evento` quando:

- ✅ **Todos os 11 testes (SM-01 a SM-11) passam** com evidência registrada
- ✅ Executados em desktop **e** mobile
- ✅ Executados em produção com o commit candidato
- ✅ Zero erros 5xx em edge functions durante a execução
- ✅ QA `<preencher>` assina abaixo:

```
Executado por: <preencher>
Data/hora UTC: <preencher>
Commit SHA testado: <preencher>
Ambiente: <preencher>
Resultado global: ☐ APROVADO / ☐ REPROVADO
Observações: <preencher>
Assinatura: <preencher>
```

Em caso de FALHA em qualquer teste: **não** liberar a tag. Registrar o incidente, decidir se é bloqueante ou aceitável para o evento (com aprovação do Arquiteto `<preencher>`), e re-executar apenas o teste afetado após correção.
