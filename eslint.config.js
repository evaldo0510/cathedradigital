import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "no-restricted-syntax": [
        "error",
        {
          "selector": "JSXAttribute[name.name='className'] > Literal[value=/\\b(p|m|gap|space|w|h)-[0-9.]+\\b/]",
          "message": "Direct Tailwind spacing detected. Use Cathedra spacing tokens (e.g., p-spacing-md) or layout components (<Stack gap=\"md\" />). Mapping: p-2 -> p-spacing-sm, p-4 -> p-spacing-md, p-8 -> p-spacing-lg."
        },
        {
          "selector": "JSXAttribute[name.name='className'] > Literal[value=/\\btext-(xs|sm|base|lg|xl|[2-9]xl)\\b/]",
          "message": "Direct Tailwind typography detected. Use Cathedra premium typography tokens. Mapping: text-sm -> text-premium-sm, text-base -> text-premium-base, text-lg -> text-premium-lg."
        },
        {
          "selector": "JSXAttribute[name.name='className'] > Literal[value=/\\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\\b/]",
          "message": "Direct Tailwind rounding detected. Use Cathedra rounded-premium tokens. Mapping: rounded-md -> rounded-premium-md, rounded-lg -> rounded-premium-lg."
        },
        {
          "selector": "JSXAttribute[name.name='className'] > Literal[value=/\\bshadow-(sm|md|lg|xl|2xl|inner|none)\\b/]",
          "message": "Direct Tailwind shadows detected. Use Cathedra shadow-premium tokens. Mapping: shadow-md -> shadow-premium, shadow-lg -> shadow-premium-hover."
        }
      ]

    },
  },
);

