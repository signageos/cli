import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import chalk from 'chalk';
import * as path from 'path';
import * as prompts from 'prompts';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';

const NAME_REGEXP = /^\w(\w|\d|-)*\w$/;
const NPM_EXECUTABLE = 'npm';

interface IFile {
	path: string;
	content: string;
}

const OPTION_LIST = [
	{ name: 'name', type: String, description: `Applet name. Match RegExp: ${NAME_REGEXP.toString()}` },
	{ name: 'applet-version', type: String, description: `Applet initial version. Use semantic version`, defaultValue: '0.0.0' },
	{ name: 'target-dir', type: String, description: 'Directory where will be the applet generated to' },
	{ name: 'npm-registry', type: String, description: `NPM registry URL. If you have your private npm registry` },
] as const;

export const appletGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generate basic applet sample',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		let appletName: string | undefined = options.name;
		if (!appletName) {
			const response = await prompts({
				type: 'text',
				name: 'name',
				message: `Type applet name`,
			});
			appletName = response.name;
		}
		if (!appletName) {
			throw new Error(`Missing argument --name <string>`);
		}
		if (!NAME_REGEXP.test(appletName)) {
			throw new Error(`Name has to match RegExp: ${NAME_REGEXP.toString()}`);
		}
		const appletRootDirectory = options['target-dir'] || path.join(currentDirectory, appletName);
		const appletRootDirectoryName = options['target-dir'] || appletName;

		let entryFileName = 'index.js';
		const dependencies = [
			'@signageos/front-applet@latest',
			'@signageos/front-display@latest',
			'@signageos/webpack-plugin@latest',
			'@babel/core@7',
			'@babel/preset-env@7',
			'babel-loader@8',
			'css-loader@6',
			'html-webpack-plugin@5',
			'style-loader@3',
			'webpack@5',
			'webpack-dev-server@4',
			'webpack-cli@4',
		];
		const fileExtensions: string[] = ['.js'];
		const imports: string[] = [
			`const HtmlWebpackPlugin = require('html-webpack-plugin')`,
			`const SignageOSPlugin = require('@signageos/webpack-plugin')`,
		];
		const rules: string[] = [
`			{
				test: /^(.(?!\.module\.css))*\.css$/,
				use: ['style-loader', 'css-loader'],
			}`,
`			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				options: { presets: [require.resolve('@babel/preset-env')] },
				enforce: 'post',
			}`,
		];
		const plugins: string[] = [
`			new HtmlWebpackPlugin({
				template: 'public/index.html',
			})`,
`			new SignageOSPlugin()`,
		];

		const generateFiles: IFile[] = [];

		// TODO typescript support
		{
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.js'),
				content: createIndexJs(),
			});
		}
		// TODO sass support
		{
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.css'),
				content: createIndexCss(),
			});
		}
		if (options['npm-registry']) {
			generateFiles.push({
				path: path.join(appletRootDirectory, '.npmrc'),
				content: createNpmRunControl(options['npm-registry']),
			});
		}
		if (!options['applet-version']) {
			throw new Error('Argument --applet-version is required');
		}
		generateFiles.push({
			path: path.join(appletRootDirectory, 'package.json'),
			content: JSON.stringify(await createPackageConfig(appletName, options['applet-version']), undefined, 2) + '\n',
		});
		generateFiles.push({
			path: path.join(appletRootDirectory, 'webpack.config.js'),
			content: createWebpackConfig(
				entryFileName,
				fileExtensions,
				imports,
				rules,
				plugins,
			),
		});
		generateFiles.push({
			path: path.join(appletRootDirectory, 'public', 'index.html'),
			content: createIndexHtml(appletName),
		});
		generateFiles.push({
			path: path.join(appletRootDirectory, '.sosignore'),
			content: 'node_modules/\n',
		});

		await fs.mkdir(appletRootDirectory);
		for (const generateFile of generateFiles) {
			await fs.ensureDir(path.dirname(generateFile.path));
			await fs.writeFile(generateFile.path, generateFile.content);
		}

		process.chdir(appletRootDirectory);
		const child = child_process.spawn(
			NPM_EXECUTABLE,
			['install', '--save-dev', ...dependencies],
			{
				stdio: 'inherit',
				shell: true,
			},
		);
		child.on('close', () => {
			console.log(`\nApplet ${chalk.green(appletName!)} created!`);
			console.log(`use: cd ${chalk.green(appletRootDirectoryName!)} and ${chalk.green('npm start')}\n`);
		});
	},
});

async function createPackageConfig(
	name: string,
	version: string,
) {
	return {
		name,
		version,
		main: 'dist/index.html',
		scripts: {
			start: "webpack serve --mode development",
			prepare: "npm run clean && npm run build",
			upload: "sos applet upload",
			clean: "npx rimraf dist",
			escheck: "npx es-check es5 dist/*.js",
			build: "webpack --mode production",
			postbuild: "npm run escheck",
			connect: "webpack --watch",
		},
		files: ['dist'],
		description: "signageOS applet",
		repository: { },
		license: "UNLICENSED",
	};
}

const createWebpackConfig = (
	entryFileName: string,
	fileExtensions: string[],
	imports: string[],
	rules: string[],
	plugins: string[],
) => `
${imports.join(';\n')}

exports = module.exports = {
	entry: ${JSON.stringify('./src/' + entryFileName)},
	target: ${JSON.stringify(['web', 'es5'])},
	output: {
		filename: 'index.js',
	},
	resolve: {
		extensions: ${JSON.stringify(fileExtensions)},
	},
	module: {
		rules: [
${rules.join(',\n')}
		],
	},
	plugins: [
${plugins.join(',\n')}
	],
};
`;

const createIndexHtml = (
	title: string,
) => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
	<meta name="theme-color" content="#000000" />
	<title>${title}</title>
</head>
<body>
	<h1>Hello ${title}</h1>
	<div id="root"></div>
</body>
</html>
`;

const createIndexJs = () => `
require('./index.css');

import sos from '@signageos/front-applet';

// Wait on sos data are ready (https://docs.signageos.io/api/js/content/latest/js-applet-basics#onready)
sos.onReady().then(async function () {
	const contentElement = document.getElementById('root');
	console.log('sOS is ready');
	contentElement.innerHTML = 'sOS is ready';
});
`;

const createIndexCss = () => `
body {
	background-color: wheat;
	text-align: center;
}
`;

const createNpmRunControl = (registryUrl: string) => `
registry=${registryUrl}
always-auth=true
`;
