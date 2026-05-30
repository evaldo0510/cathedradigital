import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
     extend: {
    spacing: {
      '0': '0px',
      'px': '1px',
      '3xs': 'var(--spacing-3xs)',
      '2xs': 'var(--spacing-2xs)',
      'xs': 'var(--spacing-xs)',
      'sm': 'var(--spacing-sm)',
      'md': 'var(--spacing-md)',
      'lg': 'var(--spacing-lg)',
      'xl': 'var(--spacing-xl)',
      '2xl': 'var(--spacing-2xl)',
      '3xl': 'var(--spacing-3xl)',
      '4xl': 'var(--spacing-4xl)',
      'spacing-3xs': 'var(--spacing-3xs)',
      'spacing-2xs': 'var(--spacing-2xs)',
      'spacing-xs': 'var(--spacing-xs)',
      'spacing-sm': 'var(--spacing-sm)',
      'spacing-md': 'var(--spacing-md)',
      'spacing-lg': 'var(--spacing-lg)',
      'spacing-xl': 'var(--spacing-xl)',
      'spacing-2xl': 'var(--spacing-2xl)',
      'spacing-3xl': 'var(--spacing-3xl)',
      'spacing-4xl': 'var(--spacing-4xl)',
    },
    fontSize: {
      'xs': 'var(--text-xs)',
      'sm': 'var(--text-sm)',
      'base': 'var(--text-base)',
      'lg': 'var(--text-lg)',
      'xl': 'var(--text-xl)',
      '2xl': 'var(--text-2xl)',
      '3xl': 'var(--text-3xl)',
      '4xl': 'var(--text-4xl)',
      '5xl': 'var(--text-5xl)',
    },
    borderRadius: {
      none: '0',
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      'premium': 'var(--radius-premium)',
      'full': '9999px',
    },
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      premium: 'var(--shadow-premium)',
      'premium-hover': 'var(--shadow-premium-hover)',
    },
    extend: {
      screens: {
        'xs': '420px',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        serif: ['Playfair Display', 'serif'],
        reader: ['Merriweather', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
      fontWeight: {
        'light': 'var(--font-weight-light)',
        'normal': 'var(--font-weight-normal)',
        'medium': 'var(--font-weight-medium)',
        'semibold': 'var(--font-weight-semibold)',
      },
      letterSpacing: {
        'premium-tight': 'var(--letter-spacing-tight)',
        'premium-wide': 'var(--letter-spacing-wide)',
        'premium-widest': 'var(--letter-spacing-widest)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s infinite"
      },
    },
  },
  plugins: [import("tailwindcss-animate")],
} satisfies Config;
