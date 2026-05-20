Create a system of intelligent contextual connections (Relatio) to link Bible, Catechism, Magisterium, Saints, and spiritual themes.

### Technical Details
*   **Component:** Create `src/components/cathedra/Relatio.tsx` to display related content in an elegant, silent way (monastic aesthetic).
*   **Logic:** Use `src/lib/nexusContent.ts` to fetch related items based on the current context (ID, tags, or text).
*   **Integration:**
    *   Add `Relatio` to `Bible.tsx` (linked to chapter/book context).
    *   Add `Relatio` to `Catechism.tsx` (linked to paragraph context).
    *   Add `Relatio` to `MagisteriumViewer.tsx` (linked to document context).
    *   Add `Relatio` to `SaintDetail.tsx` (linked to saint context).
*   **Data:** Enhance `cross-references.ts` or use existing tag-based fetching to discover connections between different types of content.

### Design Principles
*   **Silencio:** Subtle animations and quiet UI. No aggressive popups.
*   **Interligado:** Explicitly show how a Bible verse relates to a Catechism paragraph and a Saint's life.
*   **Elegance:** High-quality typography (serifs), subtle borders, and balanced whitespace.
