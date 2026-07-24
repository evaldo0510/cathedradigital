# Voice Guide Cathedra

**Versão:** 1.0.0 · **Vigente com:** Constituição Editorial 1.0.0

Este guia define **como o Cathedra fala**. Estilo é doutrina aplicada — a voz errada ensina errado, mesmo que o conteúdo esteja correto.

---

## 1. Regra de abertura

**Nunca começar textos como Wikipédia.**

**Proibido:**
> "Santo Agostinho de Hipona nasceu em 354 em Tagaste, norte da África…"

**Obrigatório:**
> "Antes de ser doutor da Igreja, Agostinho foi um homem que conheceu profundamente o combate interior — a mesma inquietude que ele nomearia, décadas depois, como o coração que não repousa senão em Deus."

A primeira frase deve **posicionar o leitor diante do mistério**, não diante de uma ficha biográfica.

Regra prática: se a abertura pode ser copiada literalmente para um verbete de dicionário sem alteração, ela está errada.

---

## 2. Vocabulário proibido

Nunca usar (em corpo editorial):

- "curiosidades", "você sabia", "top 10", "listamos"
- "saiba mais", "clique aqui", "confira", "acesse"
- "usuário", "conteúdo", "engajamento", "plataforma", "feature", "conteúdos"
- "energia", "vibração", "universo" (sentido esotérico), "manifestar"
- "brilhe", "acredite em você", "seja sua melhor versão"
- "amados irmãos", "queridos", "olá" (abertura social)
- "obviamente", "claramente", "com certeza" (retórica vazia)
- Superlativos absolutos sem lastro: "o maior", "o mais importante"

---

## 3. Vocabulário obrigatório

Sempre disponíveis (usar quando adequado, sem afetação):

- **Tradição** (maiúscula quando se refere à Tradição da Igreja)
- **Magistério**, **Catecismo**, **Escritura**, **Padres**, **Doutores**
- **Vida interior**, **combate interior**, **conversão**, **recolhimento**
- **Providência**, **graça**, **virtude**, **pecado**, **contrição**
- **Contemplação**, **meditação**, **oração vocal / mental**
- **Doutrina**, **dogma**, **Depósito da Fé**

---

## 4. Estrutura fixa de cada peça

Toda peça editorial obedece:

```
Contexto  →  Doutrina  →  Vida  →  Aplicação  →  Oração
```

- **Contexto** (1–3 frases): o problema humano ou histórico.
- **Doutrina** (parágrafo denso): o que a Igreja ensina, com referência primária.
- **Vida** (parágrafo): como um santo/Padre/Doutor viveu.
- **Aplicação** (parágrafo curto): o que muda na vida interior hoje.
- **Oração** (2–4 linhas): entrega o ensinamento a Deus.

Peças curtas (verbete, definição): a estrutura permanece, comprimida.

---

## 5. Ritmo, pontuação e tipografia

- Parágrafos **curtos** (2 a 5 frases). Nunca muros de texto.
- Frases **simples e diretas**, sujeito antes do verbo.
- **Um espaço entre parágrafos**, nunca dois.
- **Um ponto final**, nunca `...` em corpo editorial (permitido em citações originais).
- **Aspas duplas** para citações curtas; **bloco recolhido** para citações longas.
- Itálico apenas em obras (`De Trinitate`) e termos técnicos latinos (`ex opere operato`).
- Negrito apenas em nomes de doutrinas centrais ou palavras-chave doutrinárias.
- **Sem emojis, sem exclamações múltiplas, sem caixa alta enfática, sem hashtags.**

---

## 6. Títulos e subtítulos

- **H1** único por página, na voz do Cathedra (não descritivo cru).
- **H2** organiza os cinco tempos (`Contexto`, `Doutrina`, `Vida`, `Aplicação`, `Oração`) quando explícitos.
- **H3** para subdivisões dentro de um tempo.
- Nunca ultrapassar H4.
- Títulos **nunca** terminam em ponto.
- Títulos **nunca** são interrogações retóricas ("Você sabia por que…?").

---

## 7. Citações

- **Escritura:** `Jo 3, 16` (padrão brasileiro, vírgula entre capítulo e versículo).
- **Catecismo:** `CIC § 1817`.
- **Padres/Doutores:** `Agostinho, De Trinitate, IV, 12`.
- **Concílios:** `Trento, sessão VI, cân. 9`.
- **Encíclicas:** `Fides et Ratio, 43` — com link vatican.va em produção.

---

## 8. Caixas, meditações, orações

- **Caixa de meditação** (`<EditorialCard variant="meditation">`): sempre em ritmo lento, sem verbos no imperativo direto ao leitor.
- **Oração**: sempre em segunda pessoa dirigida a Deus, nunca ao leitor.
- **Colofão / rúbrica litúrgica**: em itálico, latim quando aplicável.

---

## 9. Testes rápidos antes de publicar

Antes de mudar `editorial_status → published`, a peça precisa passar em **todos**:

1. A primeira frase posiciona o leitor diante do mistério? (não é ficha)
2. Há referência primária a Escritura, Catecismo, Padres ou Magistério?
3. Existe **Aplicação** concreta para as próximas 24h?
4. Termina em **oração**?
5. Zero vocabulário proibido?
6. Zero emoji, hashtag, exclamação enfática?
7. `ice_score ≥ 95`?

Se qualquer resposta for "não" → permanece `draft`.

---

## CHANGELOG

- **1.0.0** — 2026-07-24 — Publicação inicial.
