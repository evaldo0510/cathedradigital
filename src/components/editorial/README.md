# Editorial — primitivos visuais reutilizáveis

Sprint R1 (reskin Stitch → Cathedra). Fonte da verdade da linguagem visual do Cathedra 2.x.

## Regras

- **Zero domínio**: nenhum hook, service, registry ou route específico. Só apresentação.
- **Só tokens Stitch**: `bg-stitch-*`, `text-stitch-*`, `border-stitch-*`, `font-stitch-*`. Nenhum hex hardcoded.
- **Sem `title` prop**: colide com atributo HTML. Uso `heading` ou aceito só `React.ReactNode` no slot.

## Componentes

| Nome | Uso |
|---|---|
| `EditorialShell` | Canvas base editorial com container centrado e padding responsivo. `parchment` opcional. |
| `EditorialHero` | Abertura: kicker + título display + subtítulo + filete dourado + ação. |
| `EditorialSection` | Bloco `<section>` com header interno + slot. Espaçamento vertical padrão. |
| `EditorialHeader` | Cabeçalho compacto (kicker + título + ação) para grids/listas. |
| `EditorialDivider` | Filete horizontal. Variantes: `hair`, `gold`, `gold-fade`. |
| `EditorialSurface` | Cartão base. `tier`: `lowest`\|`low`\|`base`\|`high`\|`highest`. `interactive` para hover. |
| `EditorialCard` | Cartão de conteúdo. `variant`: `plain` \| `book` (capa 2:3) \| `wide` (2 colunas). |
| `EditorialGrid` | Grid responsivo neutro. `cols`: 1..4. |
| `EditorialShelf` | Carrossel horizontal snap-scroll (estante). |
| `EditorialFooter` | Rodapé minimalista de uma linha. |

## Consumo

```tsx
import {
  EditorialShell, EditorialHero, EditorialSection,
  EditorialGrid, EditorialCard, EditorialFooter,
} from '@/components/editorial';

<EditorialShell parchment>
  <EditorialHero
    kicker="Biblioteca Viva"
    title="A tradição em suas mãos"
    subtitle="Bíblia, Padres, Concílios, Magistério e Santos, tecidos em um só percurso."
  />
  <EditorialSection kicker="Coleções" title="Percursos de leitura">
    <EditorialGrid cols={3}>{/* cards */}</EditorialGrid>
  </EditorialSection>
  <EditorialFooter kicker="Cathedra · Biblioteca Viva" />
</EditorialShell>
```

## `EditorialHero` — prop `topSpacing`

Controla o padding vertical do hero. Substitui overrides manuais (`!pt-*`, `!py-*`)
que causavam heros "colados no topo" no mobile.

| Valor | Padding | Quando usar |
|---|---|---|
| `default` | `HERO_SIZE_PAD[size]` (escala editorial completa) | Heros de páginas novas em `variant="editorial"` (Biblioteca, Home). |
| `safe` | `pt-10 pb-0 md:pt-6 md:pb-0` | Heros logo abaixo do header global. **Default para `variant="legacy"`.** |
| `flush` | `py-0` | Quando o container pai já controla o ritmo vertical (raro). |

O componente expõe `data-top-spacing` para asserts em testes de regressão.

### Padrão recomendado — páginas legacy

```tsx
<EditorialHero
  variant="legacy"          // aplica topSpacing="safe" automaticamente
  align="center"
  size="sm"
  rule={false}
  icon={<Icons.BookOpen className="w-12 h-12 text-secondary/20" />}
  title="Bíblia"
  subtitle="Palavra de Deus vivificante"
/>
```

**Não fazer:**

```tsx
// ❌ Override manual — quebra a padronização e reintroduz risco de colagem.
<EditorialHero variant="legacy" className="!pt-10 md:!pt-6 !pb-0" ... />

// ❌ topSpacing="flush" sem garantir que o pai já dá respiro no mobile.
<EditorialHero variant="legacy" topSpacing="flush" ... />
```

Quando precisar de padding lateral extra ou margem inferior (ex.: Magistério),
componha apenas essas classes no `className`, deixando o `topSpacing` cuidar do eixo Y:

```tsx
<EditorialHero
  variant="legacy"
  className="header-margin-rhythm px-spacing-md md:px-spacing-xl"
  ...
/>
```

## Não fazer

- Importar hook/service/registry aqui dentro.
- Adicionar variantes específicas de uma rota (ex: "variant='biblioteca-hero'"). Se precisar, componha do lado do consumidor.
- Usar cores fora do namespace `stitch-*` sem justificar em PR.
- Override de `padding-top`/`padding-bottom` no `className` do `EditorialHero` — use `topSpacing`.

