Corrigir os problemas de consistência visual, excesso de blocos escuros e experiência mobile no Cathedra.

### 1. Unificação da Experiência (Bíblia, CIC, Documentos, Biblioteca)
- **Cabeçalho Unificado:** Ajustar o `AppHeader.tsx` para garantir que o título e a navegação sejam consistentes em todos os módulos.
- **Layout de Conteúdo:** Padronizar a largura do conteúdo (max-width) e as margens no `App.tsx` e `ContemplativeLayout.tsx`.
- **Tipografia:** Garantir que a `Merriweather` (reader-text) e `Cinzel` (display) sejam usadas de forma idêntica em todos os modos de leitura.

### 2. Redução de Blocos Escuros e Refinamento do Dark Mode
- **Ajuste de Superfícies:** No `index.css`, suavizar as variáveis de cor para o modo escuro, trocando pretos puros por tons de grafite profundo (ex: `hsl(220 20% 6%)`).
- **Cards Mais Leves:** Alterar `CathedraCard.tsx` para remover bordas pesadas e sombras agressivas, usando fundos quase transparentes ou apenas gradientes sutis.
- **Contraste:** Melhorar a legibilidade do texto no modo noturno, ajustando a opacidade do `foreground`.

### 3. Otimização Mobile
- **Cabeçalho Compacto:** Reduzir a altura do `AppHeader` em dispositivos móveis.
- **Menu Mobile Simplificado:** Refatorar o `Sidebar.tsx` (que atua como menu mobile) para ser mais limpo, com menos divisores e tipografia mais legível.
- **Aproveitamento de Tela:** Reduzir o padding lateral e vertical no `App.tsx` para o `main-content` no mobile, focando no texto.

### 4. Reorganização da Home
- **Hierarquia Visual:** Ajustar o `HomeMainContent.tsx` para priorizar a seção de "Continuar Leitura" e os botões de acesso rápido aos módulos principais, reduzindo o peso visual da interface de busca.

### 5. Auditoria e Performance
- **Componentes Duplicados:** Investigar se `CathedraCard` e os estilos CSS de card estão redundantes.
- **Renderizações:** Adicionar `React.memo` em componentes de lista e ícones pesados.

### Detalhes Técnicos
- **CSS Variables:** Centralização de tokens de espaçamento mobile no `:root`.
- **Tailwind Config:** Garantir que o modo dark use a classe `dark` consistentemente.
- **Framer Motion:** Reduzir a complexidade das animações de entrada para melhorar o tempo de resposta no mobile.
