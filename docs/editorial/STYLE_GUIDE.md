# Style Guide Cathedra

**Versão:** 1.0.0 · Complementa o Voice Guide com decisões finas de tom, ritmo, tipografia e composição.

---

## Voz

- Coletiva, sacerdotal, sóbria.
- Terceira pessoa impessoal ou nós inclusivo (`consideremos`, `voltemo-nos`), nunca "eu".
- Nunca se dirige ao leitor como "você" em corpo doutrinal; permitido apenas em **Aplicação** e **Reflexão**.

## Tom

- **Doutrina**: firme, denso, sem hesitação.
- **Vida** (santos, Padres): narrativo contemplativo, sem romanceio.
- **Aplicação**: direto, concreto, curto.
- **Oração**: recolhido, dirigido a Deus, tradicional.

## Ritmo

- Frase média 12–20 palavras.
- Parágrafo médio 3–5 frases.
- Evitar frases de mais de 30 palavras — dividir.
- Cadência trina preferida (três membros equilibrados) em fechamentos.

## Vocabulário

- Português brasileiro culto contemporâneo, com liberdade para termos teológicos tradicionais.
- Latim litúrgico permitido quando funcional (`ex opere operato`, `sensus fidei`), sempre em itálico e traduzido na primeira ocorrência.
- Evitar neologismos, anglicismos de produto ("engajar", "features", "tips").

## Pontuação

- Vírgula serial: **não** (padrão brasileiro).
- Reticências: apenas em citações originais.
- Ponto e vírgula: permitido, com parcimônia.
- Travessão longo (—) para incisas; nunca dois hífens (`--`).
- Aspas: duplas (`"`) em texto corrido; simples (`'`) para citação dentro de citação.

## Títulos

- **H1**: 3–8 palavras, tom editorial.
  - ✔ "O silêncio que precede a fé"
  - ✖ "Fé — o que é? Como ter?"
- **H2**: 2–5 palavras, tom sóbrio.
- **H3**: livre, ≤ 8 palavras.
- Nunca ponto final. Nunca interrogação retórica.

## Subtítulos e kickers

- Kicker de hero (`EditorialHero.kicker`): 1–3 palavras, caixa alta permitida (`BIBLIOTECA VIVA`).
- Subtítulo de hero: 1 frase que reforça o mistério ou tema, sem repetir o H1.

## Citações

- Formatação padrão em `docs/editorial/VOICE_GUIDE.md § 7`.
- Bloco de citação recolhido (`<blockquote>` ou `EditorialCard variant="quote"`) para trechos ≥ 3 linhas.

## Caixas editoriais

- **Meditação** — fundo pergaminho, tipografia serifada, sem título.
- **Oração** — cabeçalho `Oração`, texto centralizado curto, sem ícones.
- **Nota histórica** — cabeçalho `Contexto histórico`, corpo neutro.
- **Advertência doutrinária** — cabeçalho `Nota doutrinária`, borda dourada.

## Orações e meditações

- Orações: 2ª pessoa dirigida a Deus/Nossa Senhora/santo. Nunca ao leitor.
- Meditações: 3ª pessoa impessoal, ritmo lento.
- Fechamento tradicional permitido: `Amém.` em linha própria, nunca em maiúsculas.

## Composição visual

- Design tokens: sempre semânticos (`bg-stitch-*`, `text-stitch-*`). Nenhum hex hardcoded.
- Ícones: Lucide sólidos, nunca emoji.
- Espaçamento: tokens `spacing-*` do design system Cathedra 2.x.
- Imagens: alt descritivo, foco no santo/cena, nunca decorativo puro em conteúdo doutrinal.

---

## CHANGELOG

- **1.0.0** — 2026-07-24 — Publicação inicial.
