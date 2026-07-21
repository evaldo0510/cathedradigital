## Sprint 4 · Onda A — Mistérios Contemplativos

Elevar cada dezena do Rosário a uma experiência de contemplação editorial, sem tocar na arquitetura do Prayer Engine v2, persistência, Nexus, TTS ou ReaderContinuation.

### 1. Banco — expansão editorial dos mistérios

Migration adicionando à tabela `prayer_mysteries` (via coluna `meta jsonb` — sem quebrar schema):

- `contemplative_title` (título contemplativo)
- `subtitle`
- `primary_passage` `{ ref, texto }`
- `complementary_passages` (2–4 refs)
- `spiritual_fruit`
- `virtue`
- `logos_meditation` (3–6 linhas)
- `contemplation_question`
- `suggested_silence` (`10|20|30|0`)
- `recommended_intention`
- `catechism_ref` (nullable)
- `patristic_ref` `{ author, work, quote }` (nullable)
- `hero_image_path` (rota do asset)

Seed dos 20 mistérios (Gozosos, Luminosos, Dolorosos, Gloriosos) com conteúdo editorial completo em PT-BR.

### 2. Imagens artísticas (20 mistérios)

Geradas com `imagegen` em qualidade `standard`, atmosfera sacra unificada (paleta Cathedra, luz suave, sem excesso decorativo). Salvas em `src/assets/rosary/misterios/{grupo}/{slug}.jpg`. Referenciadas via `meta.hero_image_path`.

### 3. Componentes novos

```text
src/components/prayer/rosary/
  MysteryHero.tsx           # Hero Logos 2030 fullscreen
  MysteryLogosMeditation.tsx # Bloco reflexão antes da 1ª Ave
  SpiritualFruitBadge.tsx   # Bloco discreto do fruto
  ContemplationQuestion.tsx # Pergunta final
  SilenceTimer.tsx          # Timer opcional (10/20/30s)
```

- `MysteryHero`: imagem fullscreen, título contemplativo, passagem, tempo estimado, botão "Iniciar contemplação". Fade suave ao entrar no Reader.
- `SilenceTimer`: seletor de duração persistido em `localStorage` por usuário, animação minimalista.

### 4. Integração no Reader

`PrayerEngineReader` (ou wrapper específico do Rosário) recebe `MysteryContext` quando a oração é o Rosário:

- Antes de cada dezena → `MysteryHero` (bloqueia até "Iniciar contemplação").
- Bloco 1 da dezena → `MysteryLogosMeditation` + `SpiritualFruitBadge` inline.
- Após última Ave-Maria da dezena → `ContemplationQuestion` + `SilenceTimer`.

Injeção via novos tipos de `prayer_blocks` (`kind = 'mystery_hero' | 'logos_meditation' | 'contemplation_question' | 'silence'`) para não hardcodar — o Reader apenas renderiza o componente correspondente ao `kind`.

### 5. Critérios de aceite (validação)

- Prayer Engine v2 continua funcional (typecheck + testes existentes verdes).
- Persistência de `prayer_sessions` inalterada.
- Nexus (`prayerAutoNexus`) segue gerando conexões.
- `PrayerTTSButton` funciona por bloco novo.
- Hero não conta como progresso.
- Todo conteúdo vem do banco.

### 6. Fora do escopo (próximas ondas)

Música ambiente, Modo Família, estatísticas, áudio sincronizado avançado, animações entre dezenas.

### Ordem de execução

1. Migration (schema + seed dos 20 mistérios com conteúdo editorial).
2. Geração das 20 imagens contemplativas.
3. Componentes novos (Hero, LogosMeditation, Fruit, Question, SilenceTimer).
4. Integração no Reader via novos `kind` de bloco.
5. Validação: typecheck, teste E2E do fluxo de um mistério.

### Nota técnica

Como são ~20 imagens standard-quality, o custo em créditos é significativo. Recomendo confirmar antes que os créditos estão restaurados (o erro 402 anterior indica esgotamento). Alternativa: gerar em qualidade `fast` primeiro e reprocessar seletivamente as que precisarem de mais fidelidade.
