import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js, prettier: prettierPlugin }, extends: ["js/recommended"], languageOptions: { globals: globals.browser }, rules: {
    'prettier/pretter': 'error',
  } },
  prettierConfig,
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]);
