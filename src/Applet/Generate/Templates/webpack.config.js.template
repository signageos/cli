const HtmlWebpackPlugin = require('html-webpack-plugin');
const SignageOSPlugin = require('@signageos/webpack-plugin')

exports = module.exports = {
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
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'], // Ensure ES5 transpilation
						cacheDirectory: true, // Speed up subsequent builds
					},
				},
			},
			{
				test: /^(.(?!.module.css))*.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{ test: /\.tsx?$/, loader: 'ts-loader' },
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'public/index.html',
		}),
		new SignageOSPlugin(),
	],
	infrastructureLogging: {
		level: 'warn',
	},
};
