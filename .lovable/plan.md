Refine the mobile scale and screen utilization of Cathedra Digital to create a more compact, fluid, and premium experience.

### Technical Detail Section
- **Global Tokens**: Adjust `--space-mobile-section`, `--space-mobile-stack-lg`, and `--space-mobile-padding` in `src/index.css` for better density.
- **Layout Spacing**: Reduce `pt` and `pb` in `ContemplativeLayout.tsx` and `HomeMainContent.tsx` on mobile.
- **Section Headers**: Tweak `SectionHeader.tsx` to use shorter vertical lines and smaller gaps on mobile.
- **Card Refinement**:
  - Normalize `p-` values in `CathedraCard`, `HomeCard`, and `HomeMainDoors`.
  - Reduce large mobile paddings in `RitualDoDia` (e.g., `p-6` to `p-4`).
  - Tighten gaps between elements inside cards (icons, titles, descriptions).
- **Visual Pauses**: Shrink mobile vertical padding in spacer elements across `HomeMainContent`.
- **Proportions**: Adjust heading sizes and tracking slightly for better mobile fit.

### Implementation Steps

1. **Update `src/index.css`**
   - Reduce `--space-mobile-section` from `3rem` to `2rem`.
   - Reduce `--space-mobile-stack-lg` from `2rem` to `1.5rem`.
   - Tweak `.app-container` mobile padding for better horizontal occupation.

2. **Refine `ContemplativeLayout.tsx`**
   - Change `pt-12` to `pt-8` and `pb-24` to `pb-16` on mobile.

3. **Adjust `SectionHeader.tsx`**
   - Reduce vertical line height on mobile from `h-12` to `h-8`.
   - Reduce gap from `gap-4` to `gap-3`.

4. **Refine `HomeMainContent.tsx`**
   - Reduce bottom padding from `pb-24` to `pb-16`.
   - Reduce "Visual Pause" paddings from `py-8` and `py-12` to `py-6` and `py-8`.
   - Update cards to use more consistent, smaller mobile padding.

5. **Polish `RitualDoDia.tsx`**
   - Reduce header padding and gaps.
   - Shrink section paddings (e.g., `p-6` -> `p-4`).
   - Reduce text sizes slightly for the Bible verse on mobile if it exceeds viewport elegantly.

6. **Compact `HomeMainDoors.tsx`**
   - Reduce card padding from `p-10` to `p-6`.
   - Reduce gap between elements.

7. **Verify Changes**
   - Check the mobile preview to ensure improved "useful area" and "visual rhythm".
