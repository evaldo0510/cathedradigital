# CATHEDRA 2.0 — ARCHITECTURE REVIEW

Status: 🟡 Aprovado com ressalvas
Base auditada: `.lovable/plan.md` (v2 por experiências)
Escopo: validar se o Cathedra 2.0 resolve os problemas do 1.0, antes de ADR, Design System, wireframes ou código.

Princípio adotado a partir desta fase: **nenhuma tela nova entra sem responder 3 perguntas** — (1) qual problema resolve, (2) como se integra aos demais ambientes, (3) simplifica ou aumenta complexidade. Resposta negativa ou vaga = tela não entra.

---

## 1. Score por domínio

Escala 0–5. Score = quanto o v2 já resolve o domínio; risco = probabilidade de virar dívida em 12 meses se seguir como está.

| Domínio | Score v1 | Score v2 | Meta | Risco residual |
|---|---|---|---|---|
| Arquitetura da Informação | 2 | 4 | 5 | 🟡 médio |
| Jornada do usuário | 2 | 4 | 5 | 🟢 baixo |
| Fluxo (sem telas mortas) | 2 | 3 | 5 | 🔴 alto |
| Escalabilidade de conteúdo | 2 | 3 | 5 | 🔴 alto |
| Coerência (toda tela justificada) | 2 | 3 | 5 | 🟡 médio |
| Nexus / Conexões unificadas | 2 | 4 | 5 | 🟡 médio |
| Modelo de dados por trás da UX | 1 | 2 | 5 | 🔴 alto |
| Governança de crescimento | 1 | 2 | 5 | 🔴 alto |
| Acessibilidade e Modo Prece | 3 | 4 | 5 | 🟢 baixo |
| Console técnico separado do produto | 1 | 4 | 5 | 🟢 baixo |

**Score global v2: 3.3 / 5.** Suficiente para virar contrato arquitetural, insuficiente para virar código.

---

## 2. Pontos fortes do v2

- Reorganização por **verbos do usuário** (Hoje / Estudar / Rezar / Formar-se / Minha Jornada) — encerra o vício de "menu igual a taxonomia eclesial".
- **Estudar por Tema** promovido a porta principal — captura a experiência-assinatura (tema atravessa Bíblia → CIC → Padres → Concílios → Aplicação).
- **⌘K Conexões** funde Busca + Nexus — elimina dois sistemas paralelos.
- **Console técnico** removido do topo — para de poluir o mapa mental do usuário.
- Padres e Concílios promovidos a **primeira classe** — corrigem lacuna histórica.
- **Modo Prece** especificado como estado global de UI, não tela — respeita "experiência espiritual acima da tecnologia".
- Nada removido; tudo reendereçado — reduz risco político e preserva investimento.

---

## 3. Riscos

### R1 — 🔴 "Estudo composto" não tem modelo de dados
A tela-assinatura ("digite 'perdão' e o Cathedra monta Bíblia+CIC+Padres+…") pressupõe uma **camada temática** que não existe hoje. Sem ela vira wireframe bonito e vazio.
**Mitigação:** antes do wireframe, especificar `TemaCanonico` (id, nome, sinônimos, refs canônicas curadas por fonte). Sem curadoria mínima inicial (~50 temas), a feature nasce quebrada.

### R2 — 🔴 Nexus como camada assume grafo que não existe
Popovers cruzando 6 fontes exigem grafo bidirecional consolidado. Hoje há relações parciais, dispersas e não versionadas.
**Mitigação:** definir `NexusEdge` (source_type, source_id, target_type, target_id, relation, weight, curated_by) e política de qualidade (curado > gerado por IA > heurístico).

### R3 — 🔴 Verbete unificado sem regra de fusão clara
Colapsar Enciclopédia + A-Z + Glossário + Dogmas em uma entidade sem regra de merge produz duplicatas semânticas (ex.: "Trindade" existirá 4 vezes).
**Mitigação:** definir `Verbete` como entidade única com `tipo ∈ {dogma, termo_teologico, verbete_geral, glossario}` e chave canônica por slug.

### R4 — 🟡 Ofício unificado risca perder granularidade litúrgica
Fundir Missal + Breviário + Liturgia + Calendário num só "Ofício" simplifica mapa, mas Breviário e Missal têm gramáticas litúrgicas diferentes.
**Mitigação:** Ofício é a **porta única**; internamente, cada momento (Laudes, Missa…) mantém seu leitor especializado. Fusão de rótulo, não de código.

### R5 — 🟡 "Minha Jornada" tende a virar depósito
6 itens (Diário, Favoritos, Notas, Histórico, Perfil, Comunidade) num só cômodo é o mesmo pecado do menu atual em escala menor.
**Mitigação:** priorizar 2 itens de topo (Diário, Favoritos) + acordeão para o resto; medir uso antes de expandir.

### R6 — 🟡 Logos IA como "camada" pode ficar invisível
Se está em toda parte, corre o risco de estar em lugar nenhum.
**Mitigação:** um único gesto consistente (botão flutuante contextual, sempre no mesmo canto, com verbo do contexto: "Explicar", "Guiar", "Aprofundar").

### R7 — 🟡 Console técnico sem plano de migração
12+ rotas técnicas hoje espalhadas. Não basta dizer "vai pra `/admin`"; precisa de mapa 1‑pra‑1 e prazo.
**Mitigação:** item explícito no roadmap (Sprint 0 técnico).

### R8 — 🔴 Falta governança de crescimento
Sem regra de entrada, em 12 meses volta a bagunça.
**Mitigação:** as 3 perguntas viram checklist obrigatório em PR de nova tela; ADR próprio para adicionar cômodo de topo.

---

## 4. Redundâncias remanescentes (após v2)

| Onde | Redundância | Ação |
|---|---|---|
| Estudar / Formar-se | "Jornada personalizada gerada de estudo" (v2 §3.2) vive nos dois | Definir que jornada nasce em Estudar, migra para Formar-se ao ser aceita |
| ⌘K Conexões / Nexus toggle no header | Dois pontos de entrada da mesma engine | Manter só ⌘K; Nexus vira preferência em Ajustes |
| Diário rápido (transversal) / Diário (cômodo) | Escrita e leitura separadas — ok, mas nome idêntico confunde | Renomear leitura para "Meu Diário" e escrita para "Anotar" |
| Hoje → Continuidade / Minha Jornada → Histórico | Sobreposição parcial | Continuidade = últimas 3 sessões abertas; Histórico = tudo |
| Testemunhos (Santos/Papas/Aparições) / Verbete | Um santo pode ter verbete E página de testemunho | Verbete é resumo; Testemunho é biografia + obras + citações. Link explícito entre os dois |

---

## 5. Complexidades desnecessárias

- **"Acento sutil por experiência"** (Fase 4) — tokens de temperatura por cômodo aumentam matriz de design sem ganho medido. **Remover até Sprint 3**, validar com uso.
- **Certamen (quiz semanal)** dentro de Formar-se — feature pesada de manter (banco de questões curadas). **Mover para backlog pós-MVP.**
- **Adoração silenciosa com timer** — feature charmosa mas fora do core. **Backlog.**
- **Comunidade em Minha Jornada** — social é módulo à parte, não subitem de perfil. **Marcar como fora do MVP 2.0.**
- **Sugestão do Nexus no Hoje** — depende de grafo maduro (R2). **Adiar até Nexus ter cobertura ≥60%.**

---

## 6. Fluxos quebrados / telas mortas potenciais

| Fluxo | Problema | Correção |
|---|---|---|
| Peregrino → HOJE sem login → "Iniciar Escuta" | v2 não diz o que acontece se áudio falhar / rede cair | Fallback texto sempre disponível; áudio é aprimoramento |
| Estudar por Tema → tema sem cobertura | v2 assume que todo tema tem 6 fontes | Definir estado "cobertura parcial" com aviso honesto ("ainda não temos Padres para este tema") |
| Estudar por Fonte → Bíblia → capítulo | Sem gancho pra voltar ao tema que trouxe o usuário | Breadcrumb temático persistente na sessão |
| Rezar → Modo Prece → fim | Não define como sair do Modo Prece de volta ao contexto anterior | Gesto único de saída (swipe/botão) que restaura estado + oferece "Anotar" |
| ⌘K → resultado em fonte inexistente pra usuário free | Sem regra de gating | Definir política: Nexus e busca são universais; gating vive em conteúdo, não em navegação |
| Testemunhos → Santo → obras | Obras de santo podem apontar de volta a Padres/Magistério | Confirmar que Nexus é bidirecional aqui também |
| Formar-se → Jornada concluída | v2 não descreve celebração/certificação nem próximo passo | Tela de conclusão + recomendação da próxima jornada |
| Minha Jornada → Assinatura | v2 colapsa checkout/upgrade/transactions em um cômodo — ok, mas fluxo de compra em si não foi desenhado | Sub-fluxo dedicado (upgrade → checkout → resultado) documentado à parte |

---

## 7. Escalabilidade — projeção 5 anos

Cenário-alvo: 500 documentos magisteriais, 8 traduções bíblicas, 120 santos, 5.000+ verbetes, ~200.000 arestas Nexus, 50.000 usuários ativos.

| Camada | Aguenta? | Notas |
|---|---|---|
| 5 cômodos de topo | ✅ | Estrutura constante |
| Estudar → Por Fonte | ✅ | Fontes crescem, cômodo não |
| Estudar → Por Tema | ⚠️ | 500+ temas exige taxonomia + facetas (área, tempo litúrgico, dificuldade) |
| Verbete unificado | ⚠️ | 5.000 verbetes exigem índice de sinônimos e desambiguação |
| Nexus | 🔴 | 200k arestas sem versionamento, curadoria e cache de vizinhança = ingovernável |
| Bíblia multi-tradução | ⚠️ | 8 traduções exigem seletor persistente + alinhamento versículo-a-versículo |
| Testemunhos | ✅ | Escala natural (lista + página) |
| Minha Jornada | ⚠️ | Diário + Notas de usuário pesado exige paginação, busca e exportação |
| Console técnico | ✅ | Isolado, escala independente |

**Conclusão:** a UX escala; o **backend semântico** (Tema, Verbete, Nexus, alinhamento bíblico) precisa de contrato de dados antes do primeiro pixel.

---

## 8. Coerência — teste das 3 perguntas em cada cômodo

| Cômodo | Problema que resolve | Integração | Simplifica? |
|---|---|---|---|
| HOJE | "Por onde começo hoje?" | Ponto de entrada e retomada | ✅ substitui dashboard-catálogo |
| ESTUDAR | "Quero entender X" | Alimenta Formar-se e Minha Jornada; consome Nexus | ✅ 1 porta pra 10 rotas |
| REZAR | "Quero rezar agora" | Alimenta Diário; usa Modo Prece | ✅ 1 porta pra 10 rotas |
| FORMAR-SE | "Quero crescer com método" | Recebe estudos salvos; alimenta Conquistas | ⚠️ ok, mas depende de Certamen ser opcional |
| MINHA JORNADA | "Onde estão minhas coisas?" | Destino de tudo que se salva | ⚠️ risco de virar depósito (R5) |

**Todo cômodo passa nas 3 perguntas.** Testar o mesmo para cada sub-tela antes de aprovar wireframe.

---

## 9. Oportunidades de simplificação (novas, além do v2)

1. **Colapsar "Continuidade" (Hoje) e "Histórico" (Minha Jornada) numa mesma estrutura** com dois filtros (recente / tudo).
2. **Estudar → Por Fonte → Bíblia** e **Rezar → Lectio Divina** podem compartilhar o mesmo leitor com "modo lectio" como toggle. Menos código, mais coerência.
3. **Verbete + Testemunho** podem ser dois `tipos` de uma mesma entidade `PáginaDeReferência`. Reduz duplicação de layout.
4. **Ofício** pode ser um único componente cronológico do dia (Laudes → Missa → Vésperas → Completas), navegável por swipe, em vez de 4 abas paralelas.
5. **Logos IA** com um único botão flutuante contextual (canto inferior-direito), verbo mudando por contexto. Elimina risco R6.

---

## 10. Roadmap de implementação (proposto)

Ordem inegociável — nenhuma etapa começa antes da anterior terminar.

```text
0.  Fechar esta Revisão                   → este documento aprovado
1.  ADR-011 "5 experiências"              → registra decisão
2.  Contrato de dados semântico           → TemaCanonico, Verbete, NexusEdge, TestemunhoRef
3.  Mapa rota-a-rota (ARC-MAP-v2.md)      → cada rota antiga → nova + redirect
4.  Console técnico consolidado           → 12+ rotas técnicas → /admin/*
5.  Design System v2 (tokens concretos)   → grid, tipografia, cores, cartões
6.  Wireframes (ordem de ROI)             → HOJE → Estudar Tema → Leitor → ⌘K → Rezar → Formar → Minha Jornada
7.  Protótipo navegável                   → clicável, sem backend, validado com 3 arquétipos
8.  Sprint 1 — HOJE + ⌘K                  → primeira entrega real
9.  Sprint 2 — Estudar por Tema (assinatura)
10. Sprints seguintes — Rezar, Formar-se, Minha Jornada, um por sprint
```

**Regra de entrada em cada sprint:** as 3 perguntas respondidas por escrito, no PR, para cada tela nova.

---

## 11. O que falta para virar "Aprovado sem ressalvas"

Checklist objetivo:

- [ ] Contrato de dados de `TemaCanonico`, `Verbete`, `NexusEdge`, `TestemunhoRef` documentado.
- [ ] Curadoria inicial de ~50 temas com 6 fontes cada (mínimo viável).
- [ ] Política de qualidade do Nexus (curado > IA > heurístico) com métricas.
- [ ] Mapa 1-pra-1 de todas as rotas atuais → v2, com redirects planejados.
- [ ] Definição do fluxo de conclusão de Jornada e do fluxo de compra/upgrade.
- [ ] Regra de merge do Verbete unificado com decisão sobre duplicatas atuais.
- [ ] 3 perguntas oficializadas como checklist de PR.
- [ ] Governança: adição de cômodo de topo exige ADR próprio.

Enquanto esses 8 itens não fecharem, **o v2 é contrato arquitetural, não licença para codar**.

---

## 12. Decisão final desta revisão

**Status: 🟡 Aprovado com ressalvas.**

O plano v2 é a espinha dorsal correta. Não vira código antes de:
1. Fechar o contrato de dados semântico (R1, R2, R3).
2. Consolidar o console técnico (R7).
3. Oficializar a governança das 3 perguntas (R8).

Cumpridas as três, este documento é reemitido como 🟢 Aprovado, e o roadmap da §10 executa em sequência.
