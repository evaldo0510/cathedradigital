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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
          foreground: "hsl(var(--destructive-foreground, 0 0% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%))",
          foreground: "hsl(var(--popover-foreground, 222.2 84% 4.9%))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Stitch namespace — Sprint R0 reskin foundation.
         * Uso: bg-stitch-primary, text-stitch-on-surface, border-stitch-outline-variant.
         * NÃO substitui os tokens semânticos existentes (background, primary, etc.).
         */
        stitch: {
          primary: {
            DEFAULT: "hsl(var(--stitch-primary))",
            foreground: "hsl(var(--stitch-on-primary))",
            container: "hsl(var(--stitch-primary-container))",
            "on-container": "hsl(var(--stitch-on-primary-container))",
            fixed: "hsl(var(--stitch-primary-fixed))",
            inverse: "hsl(var(--stitch-inverse-primary))",
          },
          secondary: {
            DEFAULT: "hsl(var(--stitch-secondary))",
            foreground: "hsl(var(--stitch-on-secondary))",
            container: "hsl(var(--stitch-secondary-container))",
            "on-container": "hsl(var(--stitch-on-secondary-container))",
            fixed: "hsl(var(--stitch-secondary-fixed))",
            "fixed-dim": "hsl(var(--stitch-secondary-fixed-dim))",
          },
          tertiary: {
            DEFAULT: "hsl(var(--stitch-tertiary))",
            fixed: "hsl(var(--stitch-tertiary-fixed))",
            "on-fixed": "hsl(var(--stitch-on-tertiary-fixed))",
          },
          background: "hsl(var(--stitch-background))",
          "on-background": "hsl(var(--stitch-on-background))",
          surface: {
            DEFAULT: "hsl(var(--stitch-surface))",
            dim: "hsl(var(--stitch-surface-dim))",
            bright: "hsl(var(--stitch-surface-bright))",
            variant: "hsl(var(--stitch-surface-variant))",
            tint: "hsl(var(--stitch-surface-tint))",
          },
          "on-surface": "hsl(var(--stitch-on-surface))",
          "on-surface-variant": "hsl(var(--stitch-on-surface-variant))",
          "surface-container-lowest": "hsl(var(--stitch-surface-container-lowest))",
          "surface-container-low": "hsl(var(--stitch-surface-container-low))",
          "surface-container": "hsl(var(--stitch-surface-container))",
          "surface-container-high": "hsl(var(--stitch-surface-container-high))",
          "surface-container-highest": "hsl(var(--stitch-surface-container-highest))",
          outline: {
            DEFAULT: "hsl(var(--stitch-outline))",
            variant: "hsl(var(--stitch-outline-variant))",
          },
          "inverse-surface": "hsl(var(--stitch-inverse-surface))",
          "inverse-on-surface": "hsl(var(--stitch-inverse-on-surface))",
          error: {
            DEFAULT: "hsl(var(--stitch-error))",
            foreground: "hsl(var(--stitch-on-error))",
            container: "hsl(var(--stitch-error-container))",
            "on-container": "hsl(var(--stitch-on-error-container))",
          },
        },
      },
      spacing: {
        'spacing-0': '0px',
        'spacing-px': '1px',
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
        'premium-xs': 'var(--text-xs)',
        'premium-sm': 'var(--text-sm)',
        'premium-base': 'var(--text-base)',
        'premium-lg': 'var(--text-lg)',
        'premium-xl': 'var(--text-xl)',
        'premium-2xl': 'var(--text-2xl)',
        'premium-3xl': 'var(--text-3xl)',
        'premium-4xl': 'var(--text-4xl)',
        'premium-5xl': 'var(--text-5xl)',
        'premium-6xl': '3.75rem',
        'premium-7xl': '4.5rem',
        'premium-8xl': '6rem',
        'premium-9xl': '8rem',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'premium-none': '0',
        'premium-sm': 'var(--radius-sm)',
        'premium-md': 'var(--radius-md)',
        'premium-lg': 'var(--radius-lg)',
        'premium': 'var(--radius-premium)',
        'premium-full': '9999px',
      },
      boxShadow: {
        'premium-none': 'none',
        'premium-sm': 'var(--shadow-sm)',
        'premium-md': 'var(--shadow-md)',
        'premium': 'var(--shadow-premium)',
        'premium-hover': 'var(--shadow-premium-hover)',
      },
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
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '1200': '1200ms',
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
  plugins: [require("tailwindcss-animate")],
} satisfies Config;