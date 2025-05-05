import { rspack } from '@rspack/core';
import { defineConfig } from '@rspack/cli';
import SignageOSPlugin from '@signageos/webpack-plugin';

export default defineConfig({
  entry: {
		main: './src/index', // Universal configuration works for .js and .ts
	},
	resolve: {
		extensionAlias: {
			'.js': ['.ts', '.tsx', '.js'], // First search for .ts, than .js
		},
		extensions: ['.ts', '.tsx', '.js'],
	},
	target: ['web', 'es5'],
	output: {
		filename: 'index.js',
	},
	module: {
		rules: [
			{
				test: /^(.(?!.module.css))*.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(tsx?|js)$/,
				loader: 'builtin:swc-loader',
				options: {
				  jsc: {
					parser: {
					  syntax: 'typescript',
					},
					target: 'es5',
				  },
				},
			},
		],
	},
	plugins: [
		new rspack.HtmlRspackPlugin({
			template: 'public/index.html',
		}),
		new SignageOSPlugin(),
	],
  infrastructureLogging: {
		level: 'warn',
	},
});
