The refinement phase for Cathedra will focus on simplifying the mobile interface, improving reading ergonomics, and unifying the visual language across all core experiences (Home, Bible, and Catechism).

### 1. Mobile & Core UI Simplification
- **Refine AppHeader & BottomNav**: Reduce vertical space. Ensure they elegantly hide on scroll.
- **Header & Section Refinement**: Update `SectionHeader` and `ContemplativeLayout` to use tighter spacing on mobile, reducing empty vertical space.
- **Card & Container Consolidation**: Update `CathedraCard` and `HomeCard` to use minimal borders and backgrounds in "Visual Silence" mode.
- **Home Layout**: Adjust `HomeMainContent` rhythm for better density. Reduce the massive spacing placeholders on mobile.

### 2. Reading Experience (Bible & Catechism)
- **Bible Reader**: Refine `Bible.tsx` to maximize reading area. Update text hierarchy and line height for premium editorial feel.
- **Catechism Explorer**: Simplify `CatechismExplorer.tsx` grid and cards to reduce visual noise.
- **Reading Controls**: Ensure `ReadingControlPanel` settings (density, spacing) are applied consistently and saved.

### 3. Visual Language & Dark Mode
- **Iconography**: Audit and enforce a unified icon style (stroke width 1.2px) across the app using the `Icons` constant.
- **Dark Mode Contrast**: Adjust CSS variables in `index.css` for better readability (reducing pure black, using deep abyssal tones).
- **Native App feel**: Improve transitions and micro-interactions for a more fluid, high-end feel.

### Technical Details
- **CSS Variable Adjustments**: Fine-tune `--space-mobile-*` tokens in `index.css`.
- **Component Updates**: Modify `AppHeader`, `BottomNav`, `Sidebar`, `CathedraCard`, `SectionHeader`, `HomeMainContent`, `Bible`, and `CatechismExplorer`.
- **Refactoring**: Ensure "Visual Silence" and "Reduce Motion" settings are respected throughout the refined components.
