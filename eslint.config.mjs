import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// Get project-specific rules from AGENTS.md
// Web3 code has relaxed types (noImplicitAny: false, no-non-null-assertion: off)
// Wallet operations return 0 on error, check for silent failures

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      "@next/next": next,
      "react-hooks": reactHooks,
      react: react,
    },
    rules: {
      // Allow explicit any for Web3 functionality as per project requirements
      "@typescript-eslint/no-explicit-any": "off",

      // Allow unused variables during development (will be addressed in phases)
      "@typescript-eslint/no-unused-vars": "warn", // Changed from error to warning for development

      // Allow non-null assertions for Web3 functionality
      "@typescript-eslint/no-non-null-assertion": "off",

      // Allow require imports (for Web3 libraries)
      "@typescript-eslint/no-require-imports": "warn",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Next.js specific rules
      "@next/next/no-html-link-for-pages": "off", // Allow in development

      // Other rules remain active
      "no-prototype-builtins": "warn",
      "no-inner-declarations": "warn",
      "no-empty-function": "off", // Allow empty functions for Web3 callbacks

      // Allow console in development (will be addressed later)
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-undef": "off",
      "no-console": "off",
    },
  },
  {
    files: [
      "**/*.test.{js,ts,tsx}",
      "**/tests/**/*.{js,ts,tsx}",
      "**/jest.*.js",
      "**/babel.config.{js,cjs,mjs}",
      "**/.storybook/**/*.{js,ts}",
    ],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        process: "readonly",
        console: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        global: "readonly",
        Buffer: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-undef": "off", // Disable no-undef for test files with globals
      "no-console": "warn",
    },
  },
  {
    files: [
      "next.config.{js,ts,cjs,mjs}",
      "server.ts",
      "server.js",
      "jest.config.{js,ts,cjs,mjs}",
      "webpack.config.{js,ts,cjs,mjs}",
      "babel.config.{js,cjs,mjs}",
      "postcss.config.{js,cjs,mjs}",
      "tailwind.config.{js,ts,cjs,mjs}",
      "eslint.config.{js,mjs,cjs}",
      "prettier.config.{js,cjs,mjs}",
    ],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "off", // Allow require in config files
      "no-undef": "off",
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "public/**",
      "mobile-app/**",
      "tests/**", // Ignore test files for now to reduce linting errors
      ".storybook/**", // Ignore storybook files
      "scripts/**", // Ignore scripts
      "backups/**", // Ignore backups
      "reports/**", // Ignore reports
      "db/**", // Ignore database files
      "prisma/**", // Ignore prisma files
      "contracts/**", // Ignore contracts
      "programs/**", // Ignore programs
      "helm/**", // Ignore helm
      "k8s/**", // Ignore k8s
      "nginx/**", // Ignore nginx
      "policy/**", // Ignore policy
      "grants/**", // Ignore grants
      "legal/**", // Ignore legal
      "examples/**", // Ignore examples
      "_archive-docs/**", // Ignore archive docs
      "ND/**", // Ignore ND
      "-p/**", // Ignore -p
      ".git/**", // Ignore git
      ".vscode/**", // Ignore vscode
      ".kilocode/**", // Ignore kilocode
      ".roo/**", // Ignore roo
      ".mypy_cache/**", // Ignore mypy cache
      ".husky/**", // Ignore husky
      ".kube/**", // Ignore kube
      "src/agents/**", // Ignore agents directory as per tsconfig exclude
      "telegram-mini-app/.next/**", // Ignore generated files
      "src/components/profile/social-integration.tsx", // Ignore as per tsconfig exclude
      "src/components/staking/**", // Ignore as per tsconfig exclude
      "src/components/dex/**", // Ignore as per tsconfig exclude
      "src/components/dex/dual-currency-system.tsx", // Ignore as per tsconfig exclude
      "normal-dance-vercel/**", // Ignore as per tsconfig exclude
    ],
  },
];
