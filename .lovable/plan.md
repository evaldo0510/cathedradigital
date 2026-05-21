Refinar a experiência emocional do Cathedra para transmitir acolhimento, profundidade e serenidade através de um design contemplativo e silencioso.

### Mudanças Propostas

#### 1. Transições e Ritmo (PageTransition)
- Aumentar a duração das transições de página de 0.8s para 1.2s para um ritmo mais calmo.
- Ajustar o easing para um movimento mais orgânico e suave.
- Adicionar uma micro-interação de "respiração" visual durante o carregamento de conteúdos.

#### 2. Silêncio Visual e Contemplação (index.css)
- Refinar a classe `.visual-silence` para ocultar elementos periféricos não essenciais de forma mais agressiva.
- Expandir o `.contemplative-mode` com filtros de cor mais quentes e suaves, reduzindo o brilho de elementos puramente brancos.
- Aumentar o `line-height` padrão para textos de leitura (`reader-text`) para 1.8.
- Reduzir o ruído visual em `premium-card` removendo bordas desnecessárias e usando sombras baseadas na profundidade (shadow-depth).

#### 3. Integração do Relatio (Relatio.tsx)
- Tornar as sugestões do Relatio ainda mais discretas, com transições de fade mais lentas ao aparecerem.
- Ajustar a tipografia das conexões para serem mais harmoniosas com o texto principal.

#### 4. Paleta e Tipografia (sacredPalette.ts e tailwind.config.ts)
- Introduzir variações de cores "serenas" que se adaptam ao contexto litúrgico de forma menos saturada.
- Ajustar o espaçamento entre letras (letter-spacing) para títulos para transmitir "direção espiritual".

### Detalhes Técnicos
- Edição em `src/components/PageTransition.tsx` para novos tempos de animação.
- Edição em `src/index.css` para novos tokens de design e classes utilitárias de silêncio.
- Edição em `src/components/cathedra/Relatio.tsx` para suavizar a entrada de conexões.
- Edição em `tailwind.config.ts` para novos valores de transição e sombras.
