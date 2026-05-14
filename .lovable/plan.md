# Unified Home and Navigation Reconnection Plan

The current site has redundant homepages (`Dashboard` and `HojePage`) and slightly disconnected navigation paths. This plan unifies the experience into a single, powerful "Hoje" (Today) portal while streamlining the content hub.

## 1. Unified Home Experience (Hoje Portal)
*   **Merge Dashboard Features**: Integrate `useDashboardData` into `HojePage` to provide personalized greetings, streaks, and XP.
*   **Personalized Progress**: Add "Next Up" (Continuar de onde parou) logic for Bible and Catechism, not just Journeys.
*   **Weekly Stats**: Add a "Frutos da Semana" section showing chapters read, paragraphs studied, and journey steps completed.
*   **Portas da Fé (Main Doors)**: Re-implement the high-impact "Main Doors" from Dashboard into HojePage for quick navigation to core modules.
*   **Nexus Integration**: Embed the Spiritual Profile insights (Nexus Bubbles) directly into the home flow.
*   **Deprecation**: Set all `/dashboard` routes to redirect to `/hoje`.

## 2. Navigation & Content Hub Streamlining
*   **Biblioteca (Explore Hub)**: Refine the `BibliotecaPage` to be the definitive directory. Group items into:
    *   **Palavra e Doutrina**: Bíblia, Catecismo, Magistério.
    *   **Vida de Oração**: Rosário, Liturgia, Breviário, Via Sacra.
    *   **Formação Intelectual**: Aquinas, Enciclopédia, Dogmas, Papas.
    *   **Caminho e Partilha**: Jornadas, Temas, Comunidade.
*   **Consistent Iconography**: Ensure the same icons are used in Sidebar, BottomNav, and Hub.

## 3. Global Search & Discovery
*   **Accessibility**: Link "Busca Global" more prominently in the UI.
*   **Connectivity**: Ensure the search covers all themes and content types.

## 4. Technical Cleanup
*   **Route Cleanup**: Remove redundant redirects and unused imports in `App.tsx`.
*   **Profile Sync**: Ensure `useAuth` and `useDashboardData` work in tandem to avoid duplicate profile fetches.

## Technical Details
*   Modify `src/components/cathedra/HojePage.tsx` to use `useDashboardData`.
*   Create `src/components/cathedra/HomeStats.tsx` and `src/components/cathedra/HomeMainDoors.tsx` as reusable widgets.
*   Update `src/App.tsx` routes.
*   Sync terminology in `src/hooks/useLang.ts` and translations.
