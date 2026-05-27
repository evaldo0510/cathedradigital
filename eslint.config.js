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
      "no-restricted-syntax": [
        "error",
        {
          "selector": "JSXOpeningElement[name.name='CathedraIcon'] JSXAttribute[name.name='size'] > Literal",
          "message": "Direct size values are not allowed on CathedraIcon. Use IconSizePreset instead."
        },
        {
          "selector": "JSXOpeningElement[name.name='CathedraIcon'] JSXAttribute[name.name='size'] > JSXExpressionContainer > :not(MemberExpression[object.name='IconSizePreset'])",
          "message": "You must use IconSizePreset for CathedraIcon size prop."
        }
      ],
    },
  },
);
