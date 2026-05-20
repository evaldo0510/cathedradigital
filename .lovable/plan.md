I will implement the Spiritual Continuity system by enhancing the existing components and creating a more cohesive experience that makes the user feel like their spiritual journey is a single, continuous flow across sessions.

### Implementation Plan

1.  **Continuar Leitura & Retomada Automática (Bible & Catechism):**
    *   Enhance `Bible.tsx` and `Catechism.tsx` to automatically save the reading position in the `reading_marks` table as the user scrolls, marked as `is_last_read`.
    *   Improve the auto-resume logic to be more seamless, reducing layout shift during initialization.
    *   Add a "Retomar de onde parei" (Resume where I left off) button in the library and main dashboards if a `last_read` mark exists.

2.  **Continuar Reflexão (Deep Content Sections):**
    *   Update `DeepContentSection.tsx` (used in Bible and Catechism) to save the "reflection" state (if the user started writing a reflection or completed a meditation exercise) to the database.
    *   Expose these pending or recent reflections in the `SpiritualContinuity` card.

3.  **Histórico Elegante (User History):**
    *   Refine the `user_history` tracking to capture more meaningful context (not just the URL, but the specific book/chapter/paragraph and title).
    *   Update `SpiritualContinuity.tsx` to display this history as a "Caminho da Fé" (Path of Faith) with elegant, minimal cards.

4.  **Progresso Espiritual Visual Discreto (Spiritual Maturity):**
    *   Implement a "Grau de Maturidade" (Maturity Degree) indicator in `SpiritualContinuity.tsx`.
    *   This will use a very thin, elegant progress bar and "Degrees" (e.g., Degree I, II, III) based on XP, avoiding any "Level 50" or game-like terminology.
    *   The visual style will use low-contrast, premium colors (gold/sand/muted-blue).

5.  **Integration & Consistency:**
    *   Ensure `HojePage.tsx` and `Dashboard.tsx` both utilize the enhanced `SpiritualContinuity` component.
    *   Add "Resumo de Ontem" (Yesterday's Summary) or "Próximo Passo" (Next Step) prompts that feel like a guide rather than a to-do list.

### Technical Details

*   **Database:** Use existing `reading_marks`, `user_history`, and `bible_chapters_read`/`catechism_paragraphs_read` tables.
*   **Context:** Leverage `useAuth` for profile data and `useReadingMarks` for state management.
*   **Animation:** Use `framer-motion` for subtle "fade and slide" transitions that feel like pages turning or a quiet morning.
*   **Design:** Follow the existing "Monastic" design system (heavy use of whitespace, serif fonts, and subtle gradients).
