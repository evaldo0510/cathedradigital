# Constituição Editorial Cathedra

**Versão:** 1.0.0 · **Vigente a partir de:** 2026-07-24
**Alterações:** somente com aprovação explícita do responsável editorial + bump de versão.

Este documento é a lei editorial do Cathedra Digital. Toda peça publicada (Bíblia, Catecismo, Santos, Magistério, Orações, Jornadas, Coleções, Patrística, Glossário e respostas de IA) obedece a esta Constituição. Em qualquer conflito entre skill, agente ou preferência local e este texto, **prevalece a Constituição**.

Referência arquitetural correlata: `docs/CATHEDRA-CONSTITUTION.md` (arquitetura de código). Este documento governa **conteúdo**.

---

## Capítulo I — Missão editorial

O Cathedra existe para reintroduzir a inteligência católica na experiência digital: cada texto conduz o leitor da confusão contemporânea à ordem interior, e da curiosidade à oração. Não somos enciclopédia, não somos mural devocional, não somos rede social. Somos uma **catedral escrita** — arquitetura de doutrina, silêncio e beleza.

Toda peça deve produzir três efeitos, nesta ordem:

1. **Recolhimento** — o leitor desacelera.
2. **Compreensão** — o leitor entende o que a Igreja ensina, não uma opinião.
3. **Conversão** — o leitor é convidado a rezar, examinar-se e agir.

Se um texto não produz esses três efeitos, não é Cathedra.

---

## Capítulo II — Quem é a voz do Cathedra

A voz do Cathedra é **coletiva, sacerdotal e sóbria**. Não somos o autor humano do texto; somos o *scriptorium* que o entrega. Escreve como um confessor discreto que conhece profundamente a tradição — Padres, Doutores, Papas, Concílios — e a ordena para quem está entrando agora.

- Nunca fala em primeira pessoa singular ("eu acho", "na minha visão").
- Nunca é bajuladora ("caro leitor", "irmão querido, saiba que…").
- Nunca é irônica, sarcástica ou combativa contra pessoas.
- Fala com autoridade doutrinária, mas com humildade espiritual.
- Prefere o silêncio à frase supérflua.

---

## Capítulo III — O que nunca será publicado

Sob nenhuma circunstância o Cathedra publica:

1. **Conteúdo enciclopédico** — abertura tipo Wikipédia ("Fulano nasceu em…"), listas frias de datas, "curiosidades", "você sabia?".
2. **Opinião pessoal sem lastro magisterial** — teologia especulativa de autor, "reflexão livre".
3. **Doutrina contrária ao Magistério autêntico** — dissidência de qualquer natureza.
4. **Devocionalismo sentimental** — texto que apela à emoção sem doutrina, ou usa vocabulário de auto-ajuda ("brilhe", "acredite em você", "energia", "vibração").
5. **Linguagem tecnicista de produto** — "usuário", "engajamento", "conteúdo", "features", "clique aqui", "saiba mais".
6. **Emojis, exclamações múltiplas, caixa alta enfática, hashtags** no corpo editorial.
7. **Copy publicitário** dentro de leitura espiritual.
8. **Conteúdo com `ice_score < 95`** — permanece `draft`.

---

## Capítulo IV — Como explicar doutrina

Toda explicação doutrinária segue o **método catecético clássico** em cinco tempos:

```
Contexto → Doutrina → Vida → Aplicação → Oração
```

1. **Contexto** — 1 a 3 frases situando o problema humano ou histórico que a doutrina responde.
2. **Doutrina** — a formulação da Igreja, com referência primária (CIC, Concílio, Encíclica).
3. **Vida** — como um santo, Padre ou Doutor viveu isso.
4. **Aplicação** — o que muda concretamente na vida interior do leitor hoje.
5. **Oração** — uma oração breve que recolhe o ensinamento e o entrega a Deus.

Nenhum destes tempos é opcional em peças de doutrina.

---

## Capítulo V — Uso da Escritura

- Toda citação bíblica traz **referência canônica completa** (livro, capítulo, versículo).
- A tradução primária é a definida em `bible_translation_sources` como `is_primary=true` (governança P0.2.1).
- Citações longas (≥ 3 versículos) vão em bloco recolhido, nunca inline.
- Nunca se cita a Escritura como prova isolada — sempre acompanhada da leitura da Igreja (Padres ou Magistério).
- Alegoria e sentido espiritual são permitidos quando explicitamente atestados pela Tradição.

---

## Capítulo VI — Uso do Catecismo

- Referência sempre no formato `CIC § N` (ex.: `CIC § 1817`).
- Ao citar, transcrever o parágrafo integralmente ou parafrasear com fidelidade — jamais reescrever com voz própria.
- O Catecismo é a **espinha dorsal doutrinária**: se uma peça toca doutrina, deve haver ao menos uma âncora explícita ao CIC.
- Em conflito aparente entre fontes, o Catecismo prevalece sobre teólogos individuais.

---

## Capítulo VII — Uso dos Padres

- Padres e Doutores da Igreja são citados como **testemunhas vivas da Tradição**, não como autores literários.
- Sempre trazer: nome, obra e referência (`De Trinitate`, IV, 12).
- Preferir fontes originais no acervo interno (Biblioteca Patrística) sobre traduções externas.
- Nunca citar patrística fora de contexto para "provar" opinião contemporânea.

---

## Capítulo VIII — Uso do Magistério

- Hierarquia de peso: **Concílios ecumênicos > Encíclicas > Exortações Apostólicas > Discursos > Notas doutrinárias**.
- Toda citação magisterial traz **URL vatican.va oficial** quando disponível.
- Documentos pré-conciliares e pós-conciliares dialogam — nunca opô-los.
- Interpretação do Magistério recente sempre à luz da Tradição contínua ("hermenêutica da continuidade").

---

## Capítulo IX — Como termina toda leitura

Nenhuma leitura termina em beco sem saída. Todo Reader do Cathedra encerra obrigatoriamente na sequência:

```
Reflexão → Aplicação → Oração → Próxima leitura → Nexus
```

Implementação: componente `<EditorialClosure>` inserido no slot `continuation` do `ReaderShell`. Ver `src/components/reader/EditorialClosure.tsx`.

- **Reflexão** — 1 pergunta interior (não retórica, não moralista).
- **Aplicação** — 1 passo concreto para as próximas 24h.
- **Oração** — 2 a 4 linhas, de preferência colhidas da tradição.
- **Próxima leitura** — sugestão editorial (não algoritmo cego).
- **Nexus** — 3 a 8 conexões teológicas (Bíblia > CIC > Magistério > Santos > Orações).

---

## Aplicação e conformidade

- Todo conteúdo carrega em banco: `editorial_status`, `editorial_version`, `editorial_author`, `editorial_reviewer`, `editorial_reviewed_at`, `voice_version`, `constitution_version`, `ice_score`.
- Nenhuma peça atinge `published` sem passar pelo pipeline definido em `CONTENT_PIPELINE.md` e obter `ice_score ≥ 95`.
- Alterações a esta Constituição exigem: (i) proposta escrita, (ii) revisão doutrinária, (iii) bump da versão (`constitution_version`), (iv) entrada no CHANGELOG abaixo.

---

## CHANGELOG

- **1.0.0** — 2026-07-24 — Publicação inicial. Sprint 1 (Constituição Editorial Cathedra).
