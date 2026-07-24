# Checklist Editorial Cathedra

**Versão:** 1.0.0 · **Vigente com:** Constituição 1.0.0 / Voice Guide 1.0.0

Nenhuma peça avança para `published` sem passar em **todos** os itens abaixo.
Implementação programática: `src/lib/editorial/checklist.ts` → `validateEditorialCompleteness(item)`.

---

## Critérios doutrinários (bloqueantes)

- [ ] **Base bíblica** — ao menos 1 referência canônica explícita (`Jo 3, 16`).
- [ ] **Catecismo** — ao menos 1 âncora `CIC § N`.
- [ ] **Magistério** — ao menos 1 referência a documento magisterial (Concílio, Encíclica, Exortação, Nota) *quando a peça toca doutrina viva*.
- [ ] **Padres/Doutores** — ao menos 1 testemunha da Tradição *quando aplicável ao tema*.
- [ ] Nenhuma afirmação contradiz o Magistério autêntico.

## Critérios editoriais (bloqueantes)

- [ ] Abertura **não-enciclopédica** (posiciona o leitor diante do mistério, não uma ficha).
- [ ] Estrutura **Contexto → Doutrina → Vida → Aplicação → Oração** presente (comprimida se peça curta).
- [ ] **Aplicação concreta** para as próximas 24h.
- [ ] Encerra em **oração** (2–4 linhas).
- [ ] Vocabulário respeita o Voice Guide (§ 2 e § 3).
- [ ] Zero emoji, hashtag, exclamação enfática, caixa alta.
- [ ] Referências canônicas no padrão do Voice Guide § 7.

## Critérios de continuidade

- [ ] **Continuidade espiritual** — leitura termina com `<EditorialClosure>` (Reflexão → Aplicação → Oração → Próxima → Nexus).
- [ ] **Nexus** entre 3 e 8 conexões, com prioridade Bíblia > CIC > Magistério > Santos > Orações.
- [ ] Nenhuma URL hardcoded — navegação via `resolveNexusHref`.

## Critérios de score

- [ ] **ICE ≥ 95** (`ice_score >= 95`).
- [ ] `constitution_version` preenchida (ex.: `"1.0.0"`).
- [ ] `voice_version` preenchida (ex.: `"1.0.0"`).
- [ ] `editorial_author` e `editorial_reviewer` distintos.
- [ ] `editorial_reviewed_at` nas últimas 90 dias.

---

## Consequência

Se qualquer item **bloqueante** falhar:

```
editorial_status = 'draft'   (nunca 'published')
```

O trigger do banco impede a promoção manual sem o papel correto (`glossary_permissions.role ∈ {editor,reviewer,admin}` ou `has_role(uid, 'admin')`).
Auditoria de cada mudança de status é registrada em `editorial_pipeline_events`.
