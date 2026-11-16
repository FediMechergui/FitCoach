import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['node_modules/**', '.audit/**', '.expo/**', 'android/**', 'ios/**', 'builds/**', 'dist/**', '.netlify/**', 'modules/**/android/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx', 'index.ts', 'app.config.ts', 'modules/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { 'react-hooks': hooks },
    rules: {
      // SQLite adapters and dynamic icon registries intentionally use these.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
