### Goals
1. **Audit & Replace `<button>` Tags**: Migrate raw HTML `<button>` elements to the standardized `Button` or `HomeButton` components across the entire site.
2. **Standardize Typography**: Remove hardcoded `text-[...]` classes and replace them with the fluid typographic scale (`text-premium-tiny`, `text-premium-small`, `text-premium-base`) to ensure legibility across all breakpoints.
3. **Consistency for Icon Buttons**: Ensure all icon-only buttons use `size="icon"`, have consistent alignment, and inherit icon sizing from the `Button` component.
4. **Accessibility Reinforcement**: Add `aria-label` to all icon buttons and ensure `aria-busy`/`aria-disabled` are correctly managed via the `Button` component.
5. **Design System Documentation**: Update the guide to include the fluid typography scale and real-world button examples.

### Technical Details
- **Component Migration**: Use `import { Button } from "@/components/ui/button"` or `HomeButton`.
- **Icon Sizing**: Remove manual `w-4 h-4` or `size={16}` from icons inside `Button size="icon"` as the component defines `[&_svg]:size-5`.
- **Typography Scale**:
  - `text-[9px]/text-[10px]` -> `text-premium-tiny`
  - `text-[11px]/text-[12px]` -> `text-premium-small`
  - `text-[14px]/text-[16px]` -> `text-premium-base`
- **Focus States**: Ensure `focus-visible` rings are consistent.

### Files to be Modified (Phased Approach)
- **Phase 1: Navigation & Header**: `AppHeader.tsx`, `LandingHeader.tsx`.
- **Phase 2: Core Features**: `Rosary.tsx`, `JornadaStepPage.tsx`, `LiturgiaPage.tsx`.
- **Phase 3: Admin & Dashboard**: `AdminDashboard.tsx`, `AdminJourneysTab.tsx`.
- **Phase 4: Misc Components**: `CookieConsent.tsx`, `FeedbackWidget.tsx`, `Certamen.tsx`.
- **Phase 5: Documentation**: `DesignSystemGuide.tsx`.
