After a structural audit of UI/UX and visual architecture, I've identified several areas for refinement to eliminate structural conflicts, redundancies, and performance bottlenecks, especially for the mobile experience.

### 1. Structural De-duplication
The project currently has overlapping header components (`LandingHeader` and `AppHeader`) and navigation patterns.
- I will consolidate logic to ensure only one header is active per view, prioritizing `AppHeader` for the logged-in experience.
- I will refine the `AppHeader` to be more minimalist on mobile, avoiding duplication with the `BottomNav`.

### 2. Responsiveness & Component Rendering
Some components are rendering hidden versions of themselves for different breakpoints, causing unnecessary DOM weight.
- I will optimize conditional rendering to ensure mobile-only elements don't bloat the desktop view and vice-versa.
- I will specifically refine the `Sidebar` and `BottomNav` interaction to prevent overlay conflicts.

### 3. Visual & Performance Optimization
- **Cleanup of Heavy Effects**: I will reduce excessive `backdrop-blur` and multi-layered shadows that impact mobile scroll performance, replacing them with more performant background-color transitions where appropriate.
- **Block & Card Scaling**: I will refine paddings and margins in `HomeMainContent` and its child blocks (`HomeMainDoors`, `RitualDoDia`) to improve screen utilization on mobile, reducing "dead space" and excessive vertical scroll.
- **Rendering Audit**: I will use `React.memo` more strategically on heavy components like `RitualDoDia` and `HomeMainContent` to prevent re-renders during global state changes (like theme toggling).

### 4. Technical Details
- **CSS Tokens**: Refine `--card-radius-mobile` and rhythm variables in `index.css` for better mobile density.
- **Component Refactoring**: 
    - `AppHeader`: Remove redundant navigation links on mobile.
    - `Sidebar`: Ensure it behaves as a true singleton and doesn't conflict with other drawers.
    - `HomeMainContent`: Adjust grid gaps and section paddings for a more "breathable" but compact mobile layout.

### Implementation Plan

1.  **Refine index.css**: Adjust global spacing and radius tokens to reduce visual weight on small screens.
2.  **Optimize AppHeader**: Ensure it stays out of the way on mobile, especially in reading contexts.
3.  **Refine HomeMainContent**: Implement better grid scaling and reduce section paddings on mobile.
4.  **Optimize RitualDoDia**: Compact the layout for mobile to ensure the "core" content is visible without excessive scrolling.
5.  **Audit Sidebar**: Ensure it uses a single instance and clean transitions.
6.  **Verify**: Check mobile preview for scroll fluidity and layout consistency.