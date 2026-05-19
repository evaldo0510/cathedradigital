## Refactor Logo VM (Visual Mark) Consistency

Standardize the main application logo across all platforms (mobile, tablet, desktop) using responsive breakpoints and consistent spacing.

### Implementation Details

1.  **Standardize Logo Sizes:**
    -   **Mobile:** 32px (`w-8 h-8`)
    -   **Tablet:** 40px (`w-10 h-10`)
    -   **Desktop:** 48px (`w-12 h-12`)

2.  **Apply to Components:**
    -   `AppHeader.tsx`: Update the main navigation logo.
    -   `LandingHeader.tsx`: Update the landing page header logo.
    -   `Sidebar.tsx`: Ensure the sidebar logo follows the scale.
    -   `Footer.tsx`: Refine the footer logo size.
    -   `SplashScreen.tsx`: Adjust the splash screen logo to be perfectly centered and sized.

3.  **Refine Spacing:**
    -   Ensure the gaps between the logo and accompanying text (like "Cathedra") are consistent across breakpoints (e.g., `gap-3` on mobile, `gap-4` on tablet, `gap-5` on desktop).

### Technical Tasks
- Edit `src/components/cathedra/AppHeader.tsx`
- Edit `src/components/landing/LandingHeader.tsx`
- Edit `src/components/cathedra/Sidebar.tsx`
- Edit `src/components/cathedra/Footer.tsx`
- Edit `src/components/cathedra/SplashScreen.tsx`
- Edit `src/constants.tsx` (to ensure the Logo component itself handles the className correctly)
