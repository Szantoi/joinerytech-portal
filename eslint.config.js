import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Workspace boundary-őr (MODULE_PACKAGES_PLAN §4.5/2): csomagba csak a
  // publikus belépési pontokon át szabad benyúlni (gyökér + /mocks + /wizard).
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '@spaceos/*/*', '@joinerytech/*/*',
              '!@spaceos/*/mocks', '!@spaceos/*/wizard', '!@joinerytech/*/mocks',
            ],
            message: 'Csomag-belsőbe tilos importálni — csak a publikus belépési pontok (gyökér, /mocks, /wizard) használhatók.',
          },
          {
            group: ['**/packages/*/src/**'],
            message: 'Relatív benyúlás a packages/ alá tilos — használd a @spaceos/* vagy @joinerytech/* csomag-importot.',
          },
        ],
      }],
    },
  },
  // Fordított él tiltása: csomag nem importálhat az app src/-éből.
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '@spaceos/*/*', '@joinerytech/*/*',
              '!@spaceos/*/mocks', '!@spaceos/*/wizard', '!@joinerytech/*/mocks',
            ],
            message: 'Csomag-belsőbe tilos importálni — csak a publikus belépési pontok (gyökér, /mocks, /wizard) használhatók.',
          },
          {
            group: ['**/packages/*/src/**'],
            message: 'Relatív benyúlás a packages/ alá tilos — használd a csomag-importot.',
          },
          {
            group: ['**/../../../../src/**', '**/../../../../../src/**'],
            message: 'Csomag nem importálhat visszafelé az app src/-éből (fordított rétegzés).',
          },
        ],
      }],
    },
  },
])
