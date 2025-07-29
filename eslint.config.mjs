// eslint.config.js
import codestyle from '@signageos/codestyle/eslint.config.mjs';

export default [
	{
		ignores: [
			'dist/**', 
			'coverage/**', 
			'**/*.config.{js,mjs}', 
			'.prettierrc.mjs', 
			'tests/output/**/*',
			'**/*.json',
		],
	},
	// Apply codestyle to TypeScript files only
	...codestyle.map(config => ({
		...config,
		files: ['**/*.{ts,tsx,mts,cts}']
	})),
	{
		files: ['./src/**/*.{ts,tsx,mts,cts}', './tests/**/*.{ts,tsx,mts,cts}', './tools/**/*.{ts,tsx,mts,cts}'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.json', './tests/tsconfig.json', './tools/docs/tsconfig.json'],
				tsconfigRootDir: '.',
			},
		},
	}
];