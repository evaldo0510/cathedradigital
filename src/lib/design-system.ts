/**
 * Cathedra Digital Design System Tokens
 * This file acts as a centralized JS reference for design tokens defined in CSS.
 */

export const DESIGN_TOKENS = {
  radius: {
    card: "2rem",
    button: "9999px",
    input: "0.75rem",
    premium: "var(--card-radius)",
  },
  shadows: {
    premium: "var(--card-shadow)",
    premiumHover: "var(--card-shadow-hover)",
    soft: "0 4px 15px -2px rgba(0, 0, 0, 0.02)",
  },
  spacing: {
    section: "py-3xl sm:py-4xl md:py-4xl lg:py-4xl",
    stack: "space-y-xl md:space-y-2xl lg:space-y-3xl",
    container: "w-full max-w-[1280px] mx-auto px-md sm:px-xl md:px-2xl lg:px-3xl",
  },
  grid: {
    standard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg md:gap-xl lg:gap-2xl",
    responsive: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl md:gap-2xl",
  }
} as const;

export const PREMIUM_CARD_CLASS = "premium-card";
export const PREMIUM_CARD_INTERACTIVE_CLASS = "premium-card-interactive";
export const PREMIUM_BUTTON_CLASS = "btn-premium";
export const PREMIUM_BUTTON_PRIMARY_CLASS = "btn-premium-primary";
export const PREMIUM_BUTTON_SECONDARY_CLASS = "btn-premium-secondary";
export const PREMIUM_BUTTON_OUTLINE_CLASS = "btn-premium-outline";
