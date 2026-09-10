import comments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import functional from 'eslint-plugin-functional';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Blank lines and comments are excluded from every size budget so documenting a
// mathematical correspondence never costs a line of implementation headroom.
const lineBudget = (max) => ['error', { max, skipBlankLines: true, skipComments: true }];

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'blob-report/',
      'reports/',
      '.stryker-tmp/',
    ],
  },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  // A suppression must say why it exists: `-- reason`. Unused suppressions are
  // already reported by ESLint's default directive checking, which `pnpm lint`
  // turns into a failure via --max-warnings=0.
  {
    plugins: { '@eslint-community/eslint-comments': comments },
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
    },
  },

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // eslint.config.js itself is JavaScript and is deliberately not type-checked.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.nodeBuiltin },
  },

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': { descriptionFormat: '^: .{10,}$' } },
      ],

      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-statements': ['error', 20],
      'max-nested-callbacks': ['error', 3],
      'max-lines': lineBudget(250),
      'max-lines-per-function': lineBudget(50),

      'no-console': 'error',
      'no-unreachable': 'error',
    },
  },

  // React components get a slightly larger budget than ordinary functions
  // because JSX is markup rather than logic.
  {
    files: ['src/**/*.tsx'],
    extends: [jsxA11y.flatConfigs.strict, reactHooks.configs.flat['recommended-latest']],
    rules: {
      'max-lines-per-function': lineBudget(70),
    },
  },

  // Immutability rules apply where the mathematics lives, not repository-wide.
  {
    files: ['src/domain/**/*.ts'],
    plugins: { functional },
    rules: {
      'functional/immutable-data': 'error',
      'functional/no-classes': 'error',
      'functional/no-let': 'error',
      'functional/no-this-expressions': 'error',
    },
  },

  {
    files: ['src/**/*.test.{ts,tsx}', 'src/testSetup.ts'],
    extends: [vitest.configs.recommended],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'max-lines-per-function': 'off',
    },
  },

  {
    files: ['e2e/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
    },
  },
);
