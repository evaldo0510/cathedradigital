## Plano de Reforma Visual (Minimalismo Espiritual)

O objetivo é transformar a interface do Cathedra Digital em algo mais contemplativo, refinado e consistente, removendo o excesso de elementos e padronizando o espaçamento e hierarquia.

### 1. CSS Global e Design System (Revisão)
- Ajustar `src/index.css` para um sistema de espaçamento mais generoso (padrão de 8px/16px/32px/64px).
- Refinar as sombras: remover sombras fortes/complexas, usar sombras sutis e naturais (`shadow-sm` para cards, `shadow-md` para elementos ativos).
- Tipografia: Garantir que o `font-display` (Cinzel) e `font-serif` (Playfair) sejam usados apenas para títulos e detalhes contemplativos, mantendo o `Inter` (sans) para legibilidade de textos longos.

### 2. Layout & Home (Simplificação)
- **Home (Index.tsx/landing):** Simplificar o Hero. Reduzir animações de partículas/background complexas para algo mais estático e elegante.
- **Espaçamento:** Aumentar o `padding` e `margin` entre seções na `LandingPage` para criar respiro (respiro é luxo visual).
- **Container Desktop:** Centralizar todo o conteúdo em `max-w-[1000px]` para uma leitura mais focada (tamanho ideal de linha), evitando que o texto "escorra" de borda a borda em monitores grandes.

### 3. Componentes e Cards (Padronização)
- **Cards:** Criar um padrão único de `rounded-2xl` e remover bordas excessivas ou gradientes de fundo muito agressivos. Manter o foco no conteúdo.
- **Hierarquia:** Reduzir o peso visual de botões secundários (usar `outline` ou `ghost` padronizado).
- **Desalinhamento:** Revisar o `desktop-layout` no CSS para forçar alinhamento centralizado com margens simétricas.

### 4. Execução Técnica
- Vou começar refatorando o `index.css` para padronizar as variáveis de sombra e espaçamento.
- Em seguida, atualizarei os componentes de layout (`Sidebar.tsx`, `AppHeader.tsx`, `Footer.tsx`) para refletir o design limpo.
- Por fim, aplicarei o design simplificado nas seções da Home, reduzindo a complexidade de `HeroContent.tsx`.
