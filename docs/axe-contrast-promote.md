# Promover uma rota para `ENFORCED_ROUTES`

Quando uma rota **tracked** atinge **0 nós** de violação de color-contrast, ela pode ser promovida para `ENFORCED_ROUTES`. A partir daí, qualquer regressão futura **quebra o build** — protegendo a rota permanentemente.

A promoção significa **editar uma linha** em:
`tests/e2e/axe-color-contrast-regression.spec.ts`

movendo a rota de:

```ts
const TRACKED_ROUTES = [
  '/exemplo',
];
```

para:

```ts
const ENFORCED_ROUTES = [
  '/exemplo',
];
```

Você tem **3 formas** de fazer isso. Escolha a que faz mais sentido para você:

---

## Opção 1 — PR automático (recomendada quando você tem muitas rotas)

O admin abre um Pull Request no GitHub para você com a mudança já feita. Basta revisar e apertar "Merge".

**Requer configuração inicial (uma vez):**
- Um token do GitHub com permissão de escrever no repo, salvo como segredo (`GITHUB_TOKEN_AXE_PROMOTION`).
- Uma edge function que recebe o clique e cria o PR.

**Vantagens:** rápido, rastreável, você não toca em código.
**Desvantagens:** precisa configurar 1 vez.

Se ainda não estiver configurado, o botão vai apenas mostrar as instruções.

---

## Opção 2 — Patch manual (recomendada para uso ocasional)

O admin gera um arquivo `.patch` que você baixa e aplica no repo com:

```bash
git apply promote-exemplo.patch
git add -A && git commit -m "axe: promote /exemplo to ENFORCED_ROUTES"
git push
```

**Vantagens:** não precisa de token nem de configuração.
**Desvantagens:** você precisa rodar o comando localmente.

---

## Opção 3 — Comando/edição direta (para quem prefere fazer na mão)

Abrir o arquivo `tests/e2e/axe-color-contrast-regression.spec.ts` e mover a linha da rota entre os arrays.

**Vantagens:** total controle, dá para promover várias rotas de uma vez.
**Desvantagens:** manual.

---

## O que acontece depois

- Próximo run do CI vai rodar o axe-core nessa rota como **ENFORCED**.
- Qualquer nova violação de color-contrast **quebra o PR** (vermelho).
- A rota some da lista "prontas para promoção" no admin.

---

## Referências

- Test spec: `tests/e2e/axe-color-contrast-regression.spec.ts`
- Workflow CI: `.github/workflows/axe-color-contrast.yml`
- Aggregator: `scripts/axe-contrast-heatmap.ts`
- Token registry: `scripts/axe-contrast-token-registry.ts`
