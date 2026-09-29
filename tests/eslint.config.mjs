// @ts-check
import js from '@eslint/js'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/', 'blob-report/'] },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Az el nem kapott (await nelkuli) Playwright hivas a leggyakoribb flaky-forras.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Az oldalobjektumok leszarmazasi lanca (BasePage) szandekos.
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test'],
              message: "A specek a keretrendszer fixture-jeit hasznaljak: import { test, expect } from '../../src/fixtures'",
            },
          ],
        },
      ],
    },
  },

  {
    files: ['specs/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-wait-for-selector': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-raw-locators': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/prefer-to-have-count': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/require-top-level-describe': 'off',
      'playwright/valid-title': 'error',
    },
  },

  {
    // A fixture-ok es a konfiguracio kozvetlenul a @playwright/test-re epulnek.
    files: ['src/fixtures/**/*.ts', 'playwright.config.ts', 'config/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  {
    files: ['eslint.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
  }
)
