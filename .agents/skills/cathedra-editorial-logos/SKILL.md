---
name: cathedra-editorial-logos
description: Estrutura editorial obrigatória de toda página de conteúdo do Cathedra (verbetes, orações, santos, jornadas, mistérios, estações, capítulos). Garante o fluxo Hero → Introdução → Conteúdo → Meditação Logos → Aplicação → Referências → Próximo passo → ReaderContinuation.
---

# Editorial Logos

Toda página editorial do Cathedra segue a mesma arquitetura de leitura. Não existe página "fria" — cada conteúdo tem introdução, corpo, meditação, aplicação, referências e continuidade.

## Estrutura canônica

```
1. Hero               → EditorialHero (título, eyebrow, meta)
2. Introdução         → parágrafo curto que situa o leitor
3. Conteúdo principal → corpo do verbete/oração/santo/etc.
4. Meditação Logos    → contemplação orientada (3–6 frases)
5. Aplicação          → convite concreto ao coração
6. Referências        → Bíblia, CIC, Magistério, Doutores (com fonte precisa)
7. Próximo passo      → CTA único e sereno
8. ReaderContinuation → continuidade na peregrinação (próximo item, jornada relacionada)
```

Nenhuma seção pode ser omitida. Se algum conteúdo não tem uma delas, a página não está pronta.

## Regras por seção

### 1. Hero
- `EditorialHero` sempre. Um único H1.
- Eyebrow contextualiza (tempo litúrgico, ambiente, categoria).
- Sem CTA no Hero — o CTA vive no "Próximo passo".

### 2. Introdução
- 2 a 4 frases. Situa o leitor: o que é, por que importa, onde se encaixa.
- Nunca "Bem-vindo(a)". Começa direto.

### 3. Conteúdo principal
- Corpo específico do módulo (definição do verbete, texto da oração, biografia do santo, etc.).
- Sem listas rasas onde cabe prosa.
- Densidade adequada ao ambiente (`biblioteca` = mais denso; `igreja/claustro` = mais respirado).

### 4. Meditação Logos
- 3 a 6 frases.
- Estrutura interna: verdade contemplada → imagem concreta → convite ao coração.
- Não é comentário acadêmico. Não é sermão. É contemplação.

### 5. Aplicação
- 1 pergunta contemplativa **ou** 1 propósito concreto.
- "Onde o Senhor me pede a mesma fidelidade hoje?" ✓
- "Reserve 5 minutos hoje para rezar por..." ✓
- Nunca lista de tarefas.

### 6. Referências
- Mínimo 3, curadas: 1 canônica (Bíblia ou CIC) + 1 magisterial + 1 devocional/santo.
- Formato: obra + seção. `CIC 2559`, `Confissões X, 27`, `Mt 6,9-13`.
- Conectadas via Nexus (`resolveNexusHref`), popover em hover.

### 7. Próximo passo
- Um CTA. Verbo suave.
- "Iniciar a oração", "Ler o capítulo seguinte", "Conhecer Santa Teresa".

### 8. ReaderContinuation
- Componente `ReaderContinuation` no rodapé.
- Sugere o próximo item da peregrinação (não "conteúdo relacionado" genérico).
- Sempre presente, mesmo em página final de série (nesse caso, aponta para o topo do módulo ou jornada correlata).

## Voz editorial (aplicada a todas as seções)

- Interior antes de exterior. Concreto antes de abstrato. Silêncio antes de ruído.
- Vocabulário da Igreja (oração, recolhimento, contrição, ofício, mistério). Sem jargão tech.
- Sem exclamações. Sem emojis. Sem urgência artificial.
- Frase curta. Depois uma mais longa que respira. Depois curta.
- Citações sempre com fonte precisa (autor + obra + seção).
- Teste do silêncio: se ler em voz alta cria calma, aprovar. Se agita, reescrever.

### Preferir
Recolher-se, deter-se, permanecer, contemplar, escutar, mistério, ofício, exame.

### Evitar
"Usuários", "plataforma", "engajamento", "conteúdo espiritual", "experiência premium", "descubra", "não perca", "bem-vindo(a)!".

## Checklist antes de aprovar página editorial

- [ ] Hero com um único H1
- [ ] Introdução presente (não pula direto ao conteúdo)
- [ ] Conteúdo principal denso e específico
- [ ] Meditação Logos escrita (não gerada aleatoriamente)
- [ ] Aplicação — 1 pergunta ou propósito concreto
- [ ] Mínimo 3 referências, com fonte precisa, via Nexus
- [ ] Próximo passo — 1 CTA sereno
- [ ] `ReaderContinuation` renderiza item real
- [ ] Nenhuma exclamação, nenhum emoji, nenhum termo tech
- [ ] Título ≤ 6 palavras; meta description ≤ 160 chars

## O que rejeitar

- Página que salta direto do Hero para lista de itens.
- Meditação genérica reutilizada em várias páginas.
- Referência sem fonte precisa ("Santo Agostinho disse..." solto).
- Múltiplos CTAs concorrentes no rodapé.
- Ausência de `ReaderContinuation`.
- Copy com jargão tech ou tom de landing page comercial.
