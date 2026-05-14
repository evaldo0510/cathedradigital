Audit and standardize all icon-only buttons to use `size="icon"`, ensure consistent SVG sizing, improve accessibility (aria-busy, aria-disabled), and expand the Design System documentation for the `Button` component.

### Step 1: Standardize Icon Buttons in `AppHeader.tsx` and `LiturgiaPage.tsx`
- Remove manual `className="w-4 h-4"` from icons inside `Button size="icon"` to let the standard `[&_svg]:size-5` from `buttonVariants` control the size.
- Replace plain `<button>` elements used for pagination in `LiturgiaPage.tsx` with `Button size="icon"`.
- Ensure all icon-only buttons have `aria-label` or `title` for accessibility.

### Step 2: Refactor `Sidebar.tsx`
- Replace manual `<button>` elements for theme toggle and audio toggle with the standard `Button` component.
- Ensure consistent styling and accessibility attributes.

### Step 3: Expand Design System Documentation
- Update `src/components/cathedra/DesignSystemGuide.tsx` to include:
    - A dedicated section for the `Button` component.
    - Examples of all variants: `default`, `primary`, `outline`, `destructive`, `ghost`, `secondary`, `link`.
    - Examples of all sizes: `sm`, `default`, `lg`, `icon`.
    - Demonstration of `isLoading` and `disabled` states across different variants.
    - Usage guidelines for icon-only buttons.

### Step 4: Accessibility and E2E Testing
- Create `src/components/ui/button-a11y.test.tsx` using Vitest and React Testing Library.
- Implement tests to:
    - Verify keyboard navigation (Tab/Shift+Tab) between buttons.
    - Check for `aria-busy` and `aria-disabled` during loading states.
    - Ensure `disabled` buttons are correctly skipped or handled in focus management.
    - Validate that icons within `size="icon"` buttons maintain consistent dimensions.

### Technical Details
- Use `screen.getByRole('button')` and `fireEvent` / `userEvent` for interaction tests.
- Leverage the existing `buttonVariants` in `src/components/ui/button.tsx` which already includes accessibility logic, but ensure it is used everywhere.
- Audit for any leftover `text-[...]` classes on buttons and replace with standardized typography variants.
