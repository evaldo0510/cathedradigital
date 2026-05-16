Refactor the Cathedra Digital layout to ensure a 100% premium experience, consistent with the Design System (radius 24px, glass backgrounds, standardized typography, and mobile-optimized spacing).

### Technical Tasks

#### 1. Global CSS Enhancements (src/index.css)
- Implement a global grid limit (`max-width: 1280px`) on the main container.
- Refine `.premium-card` to match the requested specs: `rgba(255,255,255,0.04)` background, `rgba(255,255,255,0.08)` border, and `radius: 24px`.
- Consolidate spacing tokens: standardize `section-spacing` and `stack-spacing`.
- Enforce the "Monastery" typography: Cinzel for displays, Playfair Display/EB Garamond for body content.
- Fix mobile keyboard issues by ensuring interactive areas (like LogosChat) use `dvh` and appropriate bottom safe areas.

#### 2. LogosChat Optimization (src/components/cathedra/LogosChat.tsx)
- Adjust the layout to prevent the virtual keyboard from obscuring text (using `h-[100dvh]` and relative flex positioning).
- Standardize the "Intention" field for better mobile reach.
- Ensure the "Auto-scroll" and "Pause" options are highly visible.

#### 3. Navigation Refactoring (src/components/cathedra/AppHeader.tsx, BottomNav.tsx, Sidebar.tsx)
- Standardize the AppHeader height and blur effect.
- Refine the BottomNav to use the new `btn-premium` logic and standardized icons.
- Update the Sidebar to follow the premium card style (glassy/monastery theme).

#### 4. Landing Page Consolidation (src/pages/Index.tsx)
- Wrap all landing sections in the standardized `app-container` and `section-spacing` classes.
- Audit and replace any remaining generic `bg-white` or `rounded-lg` with `premium-card` and `rounded-premium`.

#### 5. Accessibility & Responsiveness
- Ensure all interactive elements have visible focus states (`ring-2 ring-primary`).
- Verify ARIA labels across the LogosChat and CommandCenter.
- Implement a "safe-area" utility check for notched phones.

### Design Tokens
- **Radius**: 24px (rounded-premium)
- **Background**: Glassy translucency with backdrop-blur
- **Border**: Thin, subtle white-alpha (0.08)
- **Shadow**: 0 10px 30px rgba(0,0,0,0.08)
- **Typography**: Display (Cinzel), Serif (Playfair/EB Garamond)
