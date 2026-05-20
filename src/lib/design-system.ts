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
    section: "py-20 sm:py-28 md:py-36 lg:py-56",
    stack: "space-y-8 md:space-y-12 lg:space-y-16",
    container: "w-full max-w-[1280px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16",
  },
  grid: {
    standard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 lg:gap-14",
    responsive: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12",
  }
} as const;

export const PREMIUM_CARD_CLASS = "premium-card";
export const PREMIUM_CARD_INTERACTIVE_CLASS = "premium-card-interactive";
export const PREMIUM_BUTTON_CLASS = "btn-premium";
export const PREMIUM_BUTTON_PRIMARY_CLASS = "btn-premium-primary";
export const PREMIUM_BUTTON_SECONDARY_CLASS = "btn-premium-secondary";
export const PREMIUM_BUTTON_OUTLINE_CLASS = "btn-premium-outline";
