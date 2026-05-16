I will optimize the layout of Cathedra Digital by standardizing cards, buttons, and spacings across key components to align with the premium spiritual design system.

### Optimization Steps

1.  **Global Style Refinement (`src/index.css`)**
    *   Update `premium-card` to strictly use the requested design tokens (radius 24px, translucid background/border).
    *   Ensure `btn-premium` and its variants have consistent heights and typography.
    *   Refine `stack-spacing` and `section-spacing` utility classes.

2.  **Logos IA (LogosChat) Optimization**
    *   Adjust mobile layout to ensure the virtual keyboard doesn't overlap text/citations.
    *   Apply `premium-card` and `btn-premium` styles to the chat interface.
    *   Standardize typography for contemplatve reading.

3.  **Spiritual Quiz (SpiritualQuiz) Optimization**
    *   Refactor the quiz flow to show one question at a time with smooth transitions.
    *   Apply the spiritual design system to result cards and reading recommendations.
    *   Integrate discrete Bible/Catechism citations with `ReferenceModal` links.

4.  **Sacred Texts (Bible & Catechism) Optimization**
    *   Ensure Bible and Catechism viewers use the standardized `premium-card` and spacing.
    *   Refine the "Contemplative Reading" mode with better line-height and focus.

5.  **General Component Audit**
    *   Update `SaintCard` (in `Saints.tsx`) and other UI elements to use the global design system classes.

### Technical Details

*   **Design Tokens:**
    *   `border-radius`: 24px (mapped to `rounded-premium`)
    *   `background`: `rgba(255,255,255,0.04)`
    *   `border`: `1px solid rgba(255,255,255,0.08)`
    *   `box-shadow`: `0 10px 30px rgba(0,0,0,.08)`
*   **Mobile UX:** Use `h-[100dvh]` and `pb-safe` for consistent height across devices.
*   **Standardization:** Replace inline styles with CSS variables and utility classes defined in `index.css`.
