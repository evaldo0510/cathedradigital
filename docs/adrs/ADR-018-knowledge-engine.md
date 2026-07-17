# ADR-018: Knowledge Engine — domínio semântico do Cathedra 2.0

- **Status:** Aceita
- **Data:** 2026-07-17
- **Autores:** Arquitetura Cathedra 2.0
- **Códigos relacionados:** Sprint 2.0.4, Sprint 2.0.4A

---

## Contexto

Cathedra 2.0 precisa de uma camada de domínio única que represente o
grafo semântico do conhecimento católico (temas, passagens bíblicas,
CIC, magistério, padres, santos, concílios, cânones, orações,
aplicações) e ofereça navegação, busca, resolução para rotas e
agrupamentos curados.

Sem essa camada, cada ambiente (Biblioteca, Formação, Pesquisa, Nexus,
Minha Jornada) tenderia a reimplementar a lógica de "vizinhança
teológica" com dados próprios — o que já causou dívida técnica na versão
1.x (múltiplas fontes de verdade para temas e cross-references).

## Decisão

Criar `src/core/knowledge/` como núcleo puramente de domínio (sem
UI, sem React, sem Supabase, sem `fetch`) organizado em cinco peças
internas coordenadas por uma fachada pública única:

```
                      KnowledgeGraph  (única API pública)
                            │
   ┌────────────┬───────────┼────────────┬─────────────────┐
   ▼            ▼           ▼            ▼                 ▼
Registry   Navigator    Resolver      Index         CollectionRegistry
(nós +     (study,      (nó → url,    (busca         (conjuntos
 relações) expand,      via Route     textual         curados:
           pathBetween) Registry)     normalizada)   encíclicas,
                                                     evangelhos, …)
```

Regras invioláveis:

1. **Fachada única.** Consumidores externos (adapters, módulos, hooks)
   importam **apenas** `KnowledgeGraph`. Registry/Navigator/Resolver/
   Index/CollectionRegistry são detalhes de implementação.
2. **IDs canônicos.** Formato `<kind>:<slug>[:<sub>...]`,
   ASCII minúsculo, kebab-case, sem acentos. Números permanecem
   numéricos. Construção e parsing só via `buildId` / `parseId`.
3. **Rotas.** A tradução `KnowledgeNode → url` acontece **apenas** no
   `KnowledgeResolver`, delegando ao `RouteRegistry`. Nenhum outro
   ponto do domínio conhece URLs.
4. **Coleções coexistem com relações.** Uma coleção é um agrupamento
   estático (ex.: "Evangelhos"); uma relação é uma aresta semântica
   (ex.: `develops`). Um consumidor pode navegar por qualquer das duas.
5. **Independência.** Nenhuma importação de `src/modules/*`, UI,
   Supabase, React Query, `fetch` ou registries de infraestrutura.

## Consequências

Positivas

- Módulos futuros (Biblioteca, Formação, Pesquisa, Nexus, Jornada)
  compartilham uma única fonte de verdade semântica.
- Substituir o `seed.ts` por backend real na Sprint 2.0.5+ não exige
  mudar nenhum consumidor: a fachada permanece estável.
- IDs canônicos evitam dívida técnica de normalização quando o grafo
  crescer (dezenas de milhares de nós).
- Coleções permitem que Biblioteca renderize "prateleiras" sem que o
  domínio precise inventar arestas artificiais para agrupamento.

Negativas / trade-offs aceitos

- A fachada duplica assinaturas das peças internas — custo baixo,
  estabilidade alta.
- Compatibilidade transitória: `KnowledgeRegistry`, `KnowledgeNavigator`
  etc. continuam exportados pelo barrel para consumidores da Sprint
  2.0.4. Serão marcados como internos e removidos do barrel após a
  Sprint 2.0.9.

## Alternativas consideradas

- **Um único `KnowledgeService` monolítico.** Rejeitado: concentra
  responsabilidades diferentes (dados, navegação, resolução, busca) e
  dificulta substituição parcial.
- **Deixar cada módulo modelar seu próprio grafo.** Rejeitado: repete
  o erro do Cathedra 1.x e fragmenta a taxonomia 2.0.
- **Rotas embutidas em cada nó como string absoluta.** Rejeitado:
  acopla o domínio ao roteamento e obriga migração manual quando a
  árvore de rotas mudar.

## Referências

- `src/core/knowledge/README.md`
- `src/core/knowledge/ids.ts` (convenção de IDs)
- `src/core/knowledge/KnowledgeGraph.ts` (fachada pública)
- `docs/cathedra-2.0/MARCO-A-ATRIO.md` (marco anterior)
