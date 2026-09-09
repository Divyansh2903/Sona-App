const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', '.expo/**', 'dist/**', 'assets/**'],
  },
  ...expoConfig,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    settings: {
      // Pinned deliberately: eslint-plugin-react's auto-detection calls an ESLint 9
      // API that was removed in ESLint 10, and throws. An explicit version skips it.
      react: { version: '19.2' },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Build-tooling configs are CommonJS by necessity.
    files: ['eslint.config.js', 'babel.config.js', 'metro.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Polyfills must be imported before the modules that depend on them, so the
    // Buffer assignment deliberately sits between import groups. See index.ts.
    files: ['index.ts'],
    rules: {
      'import/first': 'off',
    },
  },
];
