// eslint.config.js
import codestyle from '@signageos/codestyle/eslint.config.mjs';

export default [
	{
		ignores: ['dist/**', 'tools/docs/dist/**', 'tools/**/*.mjs', 'tools/**/*.d.ts', '**/*.config.{js,mjs}', './postinstall.js', '.prettierrc.mjs', 'tests/output/**/*',],
	},
	...codestyle,
	{
		files: ['./src/**/*.{ts,tsx,mts,cts,mjs,js}', './tests/**/*.{ts,tsx,mts,cts}', './tools/**/*.{ts,tsx,mts,cts}'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.json', './tests/tsconfig.json', './tools/docs/tsconfig.json'],
				tsconfigRootDir: '.',
			},
		},
	},
];