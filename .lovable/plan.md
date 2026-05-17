Refinar a estrutura visual da Home para uma experiência premium, minimalista e organizada.

### Alterações Visuais e Estruturais

1. **Padronização de Componentes Core**
   - Atualizar `HomeCard` para um estilo mais "premium": bordas mais suaves, sombras ultra-sutis (`shadow-sm` evoluído) e transições fluidas.
   - Refinar `HomeButton` para garantir tipografia elegante e foco visual (ring) consistente.

2. **Reestruturação da Home (Index.tsx)**
   - Remover seções excedentes: Features, Testimonials, Pricing, FAQ e banners genéricos.
   - Reorganizar a página para conter exclusivamente as 6 seções solicitadas:
     - **Hero Principal**: Refinado com foco em tipografia e respiro.
     - **Continue Jornada**: Card contextual para retomar o progresso (ou iniciar).
     - **Ritual do Dia**: Integração limpa do componente de liturgia diária.
     - **Temas Principais**: Grid organizado das portas principais (Bíblia, Catecismo, etc.).
     - **Catecismo**: Destaque elegante para a seção de doutrina.
     - **Trilhas**: Carrossel ou grid de jornadas de formação.

3. **Layout e Hierarquia**
   - Centralizar todo o conteúdo desktop em um container focado (ex: `max-w-4xl` ou `max-w-5xl`).
   - Aumentar o espaçamento vertical entre seções para criar o "respiro visual" solicitado.
   - Eliminar glows, gradientes excessivos e decorações que causam ruído visual.

4. **Acessibilidade e Foco**
   - Garantir que cada elemento clicável tenha suporte total a teclado e foco visível.
   - Manter a navegação lógica e intuitiva.

### Detalhes Técnicos
- Utilizar `framer-motion` apenas para transições sutis de entrada.
- Padronizar o uso de tokens de design (cores, spacing) via Tailwind.
- Otimizar o carregamento via Suspense e Skeletons refinados.
