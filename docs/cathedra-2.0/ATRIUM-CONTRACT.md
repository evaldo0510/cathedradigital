# Sprint 2.0.1 — Contrato do Ambiente Átrio

Documento assinado antes de qualquer componente. Governa o que o Átrio **é**, **faz** e **recusa fazer**.
Fonte de verdade da Sprint 2.0.1. Se algo aqui e no código divergem, o código está errado.

Fundamentação:
- Manifesto §Pilares · §"o que não somos"
- Arquitetura da Informação §1 (Átrio)
- Jornadas §J1 (Primeiro acesso), §J3 (Primeira oração), §J6 (Continuação)
- Design System §Cartões · §Tipografia · §Ambient litúrgico
- Wireframes §Tela 1
- Blueprint §5 Sprint 2.0.1

---

## 1. Missão

> O Átrio é a **porta de entrada inteligente** do Cathedra. Ele recebe o usuário, lê sua intenção e o conduz rapidamente ao ambiente adequado. Não é uma home, não é um dashboard, não é um índice.

Regra-mãe: **nenhum usuário permanece no Átrio**. O Átrio existe para ser atravessado.

---

## 2. Entradas possíveis

O Átrio deve reconhecer e servir sete tipos de chegada:

| Entrada | Sinal técnico | Comportamento esperado |
|---|---|---|
| **E1. Primeiro acesso** | sem sessão, sem cookie, sem `continuidade` | Saudação genérica + Ritual do Dia + convite a explorar por tema |
| **E2. Usuário recorrente** | sessão válida + `continuidade` recente | Saudação nominal + "Retomar" no topo + Ritual do Dia |
| **E3. Link compartilhado** | `?ref=<recurso>` | Redirect imediato ao Leitor no recurso, Átrio nem chega a renderizar |
| **E4. Continuação de leitura** | `?resume=1` ou entrada por notificação de retomada | Foco automático em "Retomar" (scroll + highlight), sem CTA competindo |
| **E5. Pesquisa** | `?q=<termo>` | Abre overlay ⌘K com a query pré-preenchida, Átrio fica atrás |
| **E6. Notificação** (push/e-mail) | `?src=notif&goal=<jornada|prece|estudo>` | Cartão único no topo com CTA da jornada, resto do Átrio recolhido |
| **E7. Liturgia do dia** | rota `/hoje` (canônico) ou link "Ofício de hoje" | Ritual/Ofício em foco, tempo litúrgico destacado |

Todas as sete entradas usam a **mesma rota `/`**. O Átrio se adapta, não se ramifica.

---

## 3. Saídas possíveis

O Átrio só conduz para cinco destinos + uma camada:

1. **Estudar** — via Ritual do Dia, Nexus sugerido ou entrada por tema.
2. **Rezar** — via Ofício de hoje, Santo do dia, Modo Prece.
3. **Formar-se** — via Continuidade de jornada em andamento.
4. **Pesquisar** — via ⌘K no header ou entrada por tema.
5. **Minha Jornada** — via avatar, favoritos ou diário rápido.
6. **Camada Logos** — botão flutuante contextual (não é ambiente, é apoio).

**Nenhuma outra saída é permitida.** Sem links para admin, sem links para /about, /terms, /pricing dentro do corpo do Átrio (esses vivem em `Minha Jornada > Sobre` ou no footer).

---

## 4. Componentes autorizados (whitelist)

Ordem de renderização é obrigatória — de cima para baixo:

1. **Header ambiente** — logo compacto, ⌘K, ↩ Retomar, 👤 Perfil, linha 2px cor litúrgica.
2. **Saudação contextual** — Cormorant 30. Nomina se autenticado. Metadados: tempo litúrgico + dia da semana.
3. **Cartão de Ação: Ritual do Dia** — CTA primária única ("Iniciar"). 3 etapas visíveis (Escuta · Leitura · Exame).
4. **Ofício de hoje** — bloco curto, uma linha, link para `/rezar/oficio`.
5. **Santo do dia** — nome + título, uma linha, link para `/estudar/testemunhos/santos/<slug>`.
6. **Continuidade (↩ Retomar)** — no máximo **3 itens**. Fixo, não sumível.
7. **Nexus sugere** — no máximo **1 sugestão** por sessão. Opt-out global respeitado.
8. **Bottom-nav** — 5 ambientes. Fixo, safe-area.

Componentes 4 e 5 podem colapsar em uma linha só em telas < 360px.

---

## 5. Componentes proibidos (blacklist inegociável)

Nenhum destes aparece no Átrio, em nenhuma condição:

- Dashboards administrativos, métricas técnicas, telemetria.
- Streak, XP, badges de gamificação (vivem em Formar-se §Conquistas).
- Grid ou lista de "todos os módulos" (isso é Biblioteca, não Átrio).
- Menu de configurações profundas (vive em Minha Jornada).
- Banner de upgrade/pricing (aparece em contexto de gating, nunca no Átrio).
- Feed de comunidade, chat, notificações inline.
- Anúncios, tour interativo, popovers de onboarding.
- Mais de uma CTA primária. Segunda CTA = falha de projeto.
- Qualquer promessa que não tenha destino real (link morto = falha).

---

## 6. Estados

| Estado | Gatilho | Diferença visual |
|---|---|---|
| **Anônimo (E1)** | sem sessão | Saudação "Pax et bonum" sem nome; sem "Retomar"; CTA "Explorar por tema" no lugar |
| **Autenticado sem histórico** | sessão nova | Nome + Ritual do Dia + sem "Retomar" + Nexus sugere |
| **Autenticado com histórico** | sessão + continuidade | Estado canônico do wireframe Tela 1 |
| **Retomada (E4)** | `?resume=1` | Bloco "Retomar" recebe scroll automático + destaque; Ritual recolhido |
| **Notificação (E6)** | `?src=notif` | Cartão da meta no topo; resto do Átrio abaixo do fold |
| **Modo Prece ativo** | flag global | Átrio não renderiza header/nav; fundo escurece; saída única "Sair da prece" |
| **Offline** | sem rede | Saudação + Ritual em cache; "Retomar" com dados locais; sem Nexus sugerido |
| **Erro** | falha de fetch | Saudação + mensagem sóbria "Estamos em silêncio hoje"; link único para `/pesquisar` |
| **E9. Continuar minha caminhada** | usuário recorrente com ao menos 1 atividade não concluída em qualquer ambiente | **Primeiro bloco visível**, acima do Ritual do Dia. Rótulo único "Continuar minha caminhada". Verbos contextuais: *Continue João 6* · *Continue o estudo "Esperança"* · *Continue a Formação "Cristologia"* · *Continue a Lectio Divina* · *Continue sua anotação* · *Continue sua oração*. Máx. 3 itens, ordem por recência × proximidade da conclusão. |

Toda outra combinação é bug.

### Regra do Estado 9

- Só existe para usuário **recorrente autenticado**. Anônimo não vê.
- Substitui o antigo bloco "Retomar" quando ativo — não convivem.
- Cada item leva direto ao ponto exato (parágrafo do leitor, passo da jornada, campo do diário aberto).
- Se todas as atividades estão concluídas, o bloco some (não vira "Comece algo novo" — isso já é o Ritual do Dia).
- Origem dos dados: mesmo `user_events` da Continuidade (§11), enriquecido com tipo de atividade e progresso.

---

## 6b. Personalização por perfil (missão, não estética)

O Átrio **muda de missão** conforme o perfil declarado do usuário. O **layout permanece o mesmo**; muda apenas a **ordem de prioridade dos blocos** (§6c) e os rótulos das CTAs.

| Perfil | Sinal técnico | Blocos priorizados (topo → base) |
|---|---|---|
| **Visitante** (E1) | sem sessão | Conheça o Cathedra · Comece um estudo · Liturgia do dia |
| **Recorrente** | sessão + histórico | Continuar minha caminhada (E9) · Recomendações · Pesquisa |
| **Catequista** | perfil `catequista` | Preparar encontro · Biblioteca · Formação |
| **Sacerdote** | perfil `sacerdote` | Liturgia · Magistério · Homilia · Código Canônico |
| **Seminarista** | perfil `seminarista` | Estudos · Leituras · Nexus |

Regras:

- Perfil é declarado em `Minha Jornada > Perfil`. Enquanto não declarado, cai em **Recorrente** (autenticado) ou **Visitante** (anônimo).
- Nunca há perfil "detectado por comportamento" nesta sprint. Somente auto-declarado.
- Zero conteúdo removido por perfil — apenas reordenado. Todo bloco continua acessível via bottom-nav.
- Perfis Catequista/Sacerdote/Seminarista **entram como stubs de ordem** na 2.0.1; a superfície real (ex.: "Preparar encontro") é entregue nas sprints dos respectivos ambientes.

---

## 6c. Prioridade dos blocos (contrato de ordenação)

Toda decisão futura sobre "onde entra o novo recurso X no Átrio" consulta esta tabela. Nada entra fora dela.

| Prioridade | Bloco | Exige |
|---|---|---|
| **P0** | Continuar minha caminhada (E9) | sessão + histórico |
| **P1** | Pesquisa Universal (⌘K) | sempre visível (header) |
| **P2** | Entrada por Tema | sempre visível |
| **P3** | Liturgia do Dia (Ritual + Ofício + Santo) | sempre visível |
| **P4** | Cinco Ambientes (bottom-nav) | sempre visível |
| **P5** | Recomendações (Nexus sugere) | opt-in global respeitado |
| **P6** | Novidades / avisos institucionais | apenas quando houver, máx. 1 por sessão |

Regras de aplicação:

- A ordem visual **é exatamente** P0 → P6 quando todos os blocos aplicáveis estão presentes.
- Perfil (§6b) só **reordena entre P2, P3 e P5** — nunca altera P0, P1, P4.
- Novo recurso proposto que não caiba em nenhuma prioridade **não entra no Átrio** — vai para o ambiente correspondente.

---

## 7. Entrada por tema (elevar o Nexus a diferencial)

Recomendação arquitetural: o Átrio oferece uma **entrada por tema** ao lado do Ritual do Dia, para usuários que chegam com uma intenção específica ("quero estudar Esperança").

### Comportamento

- Campo compacto abaixo do Ritual do Dia: "Estudar sobre…".
- Ao submeter, roteia para `/estudar/tema/<slug>` → renderiza **Estudo Composto** (Wireframe §Tela 2b).
- Estudo Composto retorna cobertura em: **Bíblia · Catecismo · Magistério · Padres · Santos · Aplicação · Orações relacionadas**.
- Se o tema não existe em `tema_canonico`, cai em `/pesquisar?q=<termo>` — nunca em página vazia.

### Restrição

- Não substitui o Ritual do Dia; convive com ele.
- Não é chatbot; é lookup em `tema_canonico`.
- No Sprint 2.0.1, o campo pode existir como **placeholder** que só direciona para `/estudar` — a experiência composta completa é da Sprint 2.0.2/2.0.3.

---

## 8. Critério de sucesso

### KPI primário (bloqueante para release)

> **Três interações no máximo, do primeiro toque até o conteúdo desejado.**

Definição operacional:
- "Interação" = toque intencional (tap/click/enter). Scroll não conta. Abrir ⌘K conta 1.
- "Conteúdo desejado" = qualquer tela que sirva a uma das 6 jornadas J1–J6.
- Medido em 6 fluxos-teste rodados manualmente + telemetria anônima.

**Se qualquer fluxo exigir ≥4 interações, o release é bloqueado.**

### KPIs secundários

| Métrica | Meta | Instrumentação |
|---|---|---|
| LCP no Átrio (mobile 4G) | ≤ 2.0 s | Web Vitals |
| INP no Átrio | ≤ 200 ms | Web Vitals |
| CLS | ≤ 0.05 | Web Vitals |
| Bounce em `/` (30 dias após release) | ↓ vs. 1.x | GA4 |
| Taxa de "atravessar" (usuário sai do Átrio em <30s para outro ambiente) | ≥ 70% | evento `atrium_exit` |
| Zero rotas 1.x quebradas | 100% redirects | verificação automatizada |

---

## 9. Fluxos-teste (rodar antes do release)

Cada fluxo abaixo tem que fechar em ≤ 3 interações:

1. **F1 — Anônimo quer ler a Bíblia:** entra em `/` → tap "Iniciar" Ritual → tap "Leitura" → Leitor abre. (3)
2. **F2 — Recorrente retoma:** entra em `/` → tap em item da Continuidade → Leitor abre. (2)
3. **F3 — Quer rezar Laudes agora:** entra em `/` → tap "Rezar Laudes" → Leitor em Modo Prece. (2)
4. **F4 — Sabe o que buscar:** entra em `/` → tap ⌘K → digita → Enter. (3, digitar não conta)
5. **F5 — Quer estudar um tema:** entra em `/` → tap "Estudar sobre…" → escolhe "Esperança" → Estudo Composto. (3)
6. **F6 — Continua jornada:** entra em `/` → tap "Jornada Introdução (4/14)" na Continuidade → Passo 5 abre. (2)

Se algum fluxo passar de 3, revisar o Átrio antes de codificar mais.

---

## 10. Fora de escopo desta sprint

- Ritual do Dia com conteúdo real gerado do dia (usa stub curado até haver curadoria).
- Nexus sugere real (usa top-tema fixo do tempo litúrgico corrente).
- Notificações push (E6 é reconhecida via querystring, não via serviço push).
- Analytics avançado do Átrio além dos Web Vitals + `atrium_exit`.
- Reescrita de qualquer rota que não seja `/` e seus redirects diretos.

---

## 11. Contrato de dados (mínimo para 2.0.1)

Nenhuma tabela nova é criada nesta sprint. O Átrio consome:

| Dado | Origem | Fallback |
|---|---|---|
| Tempo litúrgico + cor + santo do dia | serviço `liturgical-day` existente | cache do dia anterior; se nada, "Tempo Comum" + sem santo |
| Continuidade (últimas 3 sessões) | `user_events` filtrado por tipos `read/prayed/journey_step` | vazio (bloco "Retomar" some) |
| Nexus sugere | `tema_canonico` (a criar em 2.0.2) — nesta sprint, **lista curada fixa** por tempo litúrgico | some |
| Ritual do Dia (3 passos) | curadoria estática mapeada por tempo litúrgico | passos genéricos "Sl 23 · Jo 15 · Exame" |

Zero chamadas de rede novas. Se `liturgical-day` falhar, o Átrio continua útil.

---

## 12. Checklist de encerramento da Sprint 2.0.1

Copiar para o ADR de fechamento:

```text
[ ] Contrato §4 (whitelist) implementado na ordem exata
[ ] Contrato §5 (blacklist) auditado — nenhum item presente
[ ] 8 estados de §6 renderizam sem regressão
[ ] 6 fluxos-teste §9 fecham em <= 3 interações
[ ] Web Vitals dentro das metas §8
[ ] Redirects de /hoje, /dashboard -> / funcionando
[ ] ff_atrio_v2 ativa em produção
[ ] Blueprint §4 (Mapa de peças) atualizado (Átrio: verde)
[ ] Nenhuma rota nova fora de / criada nesta sprint
[ ] Zero libs novas adicionadas
```

---

## 13. O que sai daqui para as próximas sprints

- **Para 2.0.2 (Estudar estrutura):** o campo "Estudar sobre…" precisa de destino real (`tema_canonico` + `/estudar/tema/<slug>`).
- **Para 2.0.3 (Leitor Universal):** os links da Continuidade e do Ritual apontam hoje para o leitor 1.x — na 2.0.3 passam a apontar para o Leitor Universal, sem mudar o Átrio.
- **Para 2.0.5 (Nexus):** "Nexus sugere" deixa de ser lista fixa e passa a consumir `nexus_edge`.
- **Para 2.0.6 (Minha Jornada):** ícone 👤 do header hoje vai para `/profile` (1.x); após 2.0.6, vai para `/minha-jornada`.

Nada disso é feito nesta sprint. Apenas registrado como dívida controlada.
