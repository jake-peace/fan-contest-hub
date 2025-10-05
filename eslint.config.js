import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import nextPlugin from '@next/eslint-plugin-next';
import prettierPlugin from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

// The new Flat Configuration returns an array of config objects.
export default [
	// 1. Base Configuration for all files
	{
		ignores: ['node_modules/', '.next/', 'dist/', 'build/', '*.config.js', 'amplify/', '.amplify/', 'next-env.d.ts'],
	},

	// 2. Standard JavaScript Rules
	pluginJs.configs.recommended,

	// 3. TypeScript Configuration
	...tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			// Setup parser options for TypeScript files
			parserOptions: {
				project: './tsconfig.json',
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		rules: {
			// 🛑 Critical: Configure unused vars rule for TypeScript
			// This will show unused imports/variables as warnings
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},

	// 4. React-Specific Rules
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			react: pluginReact,
		},
		settings: {
			react: {
				version: 'detect', // Automatically detect React version
			},
		},
		languageOptions: {
			// Enable JSX environment and modern JS
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			// Define environments for React (browser for hooks, etc.)
			globals: {
				...globals.browser,
			},
		},
		rules: {
			...pluginReact.configs.recommended.rules,
			...pluginReact.configs['jsx-runtime'].rules, // Rules for new JSX transform
			'react/prop-types': 'off', // Disable PropTypes check in modern React/TS
			'react/react-in-jsx-scope': 'off', // Not needed with Next.js/React 17+
		},
	},

	// 5. Next.js Specific Rules (FIXED)
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			// FIX: Map the plugin ID to the imported object
			'@next/next': nextPlugin,
		},
		// Manually merge the rules from the recommended configurations
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs['core-web-vitals'].rules,
			// You can override specific Next.js rules here if needed
		},
	},

	// 6. Prettier Integration (MUST be the last config in the array)
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			prettier: prettierPlugin,
		},
		// Extends the base Prettier config to turn off conflicting ESLint rules
		...configPrettier,
		rules: {
			// Ensures Prettier runs as an ESLint rule and reports formatting conflicts
			'prettier/prettier': 'error',
		},
	},
];
