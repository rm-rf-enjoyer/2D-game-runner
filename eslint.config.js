import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['node_modules/**', 'dist/**', 'android/**', 'src/assets/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier
);
