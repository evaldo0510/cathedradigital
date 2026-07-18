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

## Não fazer

- Importar hook/service/registry aqui dentro.
- Adicionar variantes específicas de uma rota (ex: "variant='biblioteca-hero'"). Se precisar, componha do lado do consumidor.
- Usar cores fora do namespace `stitch-*` sem justificar em PR.
