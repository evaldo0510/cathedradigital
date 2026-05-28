Implementarei um sistema de **Trilhas Espirituais Guiadas (Itineraria)**, transformando o Cathedra em uma jornada progressiva e contemplativa.

### 1. Estrutura de Dados e Backend
- Já foram criadas as tabelas `itineraria`, `itineraria_steps` e `itineraria_progress` via migração.
- A view `view_itineraria_with_stats` foi configurada para facilitar a listagem no frontend com segurança.

### 2. Interface de Listagem (ItinerariaPage)
- Criar `src/components/cathedra/ItinerariaPage.tsx` inspirada na `JornadasPage.tsx`, mas com um design editorial premium.
- Foco em tipografia elegante, espaçamento generoso e iconografia minimalista.
- Categorias como "Purificação", "Iluminação" e "União" (Três Vias da Vida Espiritual).

### 3. Detalhes da Trilha (ItinerariumDetailPage)
- Criar `src/components/cathedra/ItinerariumDetailPage.tsx`.
- Visual imersivo com banner de cobertura e resumo da jornada.
- Timeline vertical elegante para os passos, diferenciando tipos de atividades (Leitura, Oração, Logos IA).

### 4. Experiência do Passo (ItinerariumStepPage)
- Criar `src/components/cathedra/ItinerariumStepPage.tsx`.
- Interface focada em "Silêncio Visual", ocultando distrações.
- Suporte a múltiplos tipos de conteúdo:
    - **Leitura:** Markdown rico com referências bíblicas/catequéticas.
    - **Oração:** Espaço para meditação com áudio ambiente (opcional).
    - **Logos IA:** Drawer integrado para aprofundamento contextual.
    - **Reflexão:** Journal espiritual integrado para salvar insights.

### 5. Integração Logos IA
- Refinar o prompt da Logos IA dentro das trilhas para que ela atue como um "Mentor de Caminhada", sugerindo conexões entre os passos anteriores e o atual.

### 6. Navegação e SEO
- Registrar as novas rotas em `src/App.tsx`.
- Adicionar metadados SEO específicos para as trilhas.

---

### Detalhes Técnicos

- **Tecnologias:** React, Framer Motion (para transições suaves), Lucide React (ícones), Tailwind CSS, Supabase.
- **Transições:** Uso de `AnimatePresence` e `motion` para garantir que a mudança entre passos pareça uma caminhada fluida, não um carregamento de página.
- **Persistência:** Sincronização em tempo real do progresso via Supabase.
- **Componentização:** Reutilização de `Relatio.tsx` e `LogosAI.tsx` para manter a consistência do ecossistema.
