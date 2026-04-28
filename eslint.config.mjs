// eslint.config.js
import codestyle from '@signageos/codestyle/eslint.config.mjs';
import globals from 'globals';

export default [
	{
		ignores: [
			'dist/**', 
			'coverage/**', 
			'**/*.config.{js,mjs}', 
			'.prettierrc.mjs', 
			'tests/output/**/*',
			'**/*.json',
			'**/*.md',
			'tools/*.mjs',
			'postinstall.js',
		],
	},
	// Apply codestyle configs (keep original file patterns, they already target TS/JS)
	...codestyle,
	{
		files: ['./src/**/*.{ts,tsx,mts,cts}', './tools/**/*.{ts,tsx,mts,cts}', './tests/**/*.{ts,tsx,mts,cts}'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.json', './tools/docs/tsconfig.json', './tsconfig.test.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	}
];