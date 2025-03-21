import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import chalk from 'chalk';
import * as path from 'path';
import * as prompts from 'prompts';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';

enum Language {
	JavaScript = 'javascript',
	TypeScript = 'typescript',
}

enum Bundler {
	Webpack = 'webpack',
	Esbuild = 'esbuild',
}

enum GitOptions {
	No = 'no',
	Yes = 'yes',
}

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
	{ name: 'language', type: String, description: `Generate applet with "typescript" or "javascript" source code` },
	{ name: 'bundler', type: String, description: `Generate applet with "webpack" (default) or "esbuild" bundler`, defaultValue: 'webpack' },
	{ name: 'git', type: String, description: `Init applet as git repository` },
] as const;

const COMMON_DEPENDENCIES = ['@signageos/front-applet@latest', '@signageos/front-display@latest'];

const WEBPACK_DEPENDENCIES = [
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

const ESBUILD_DEPENDENCIES = ['@signageos/lib@latest', 'esbuild@latest', 'es-check@latest'];

const COMMON_SCRIPTS = {
	prepare: 'npm run clean && npm run build',
	upload: 'sos applet upload',
	clean: 'npx rimraf dist',
	escheck: 'npx es-check --module es5 dist/*.js',
	postbuild: 'npm run escheck',
};

const WEBPACK_SCRIPTS = {
	start: 'webpack serve --mode development',
	build: 'webpack --mode production && npm run escheck',
	connect: 'echo "Deprecated command \"npm run connect\". Use \"npm run watch\" instead." && npm run watch',
	watch: 'webpack --watch',
};

const ESBUILD_SCRIPTS = {
	// TODO add start and watch
	build: 'node ./esbuild.config.mjs',
};

export const appletGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generate basic applet sample',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();

		// Applet Name
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

		// Language select
		let language: Language | undefined = options.language as Language | undefined;
		if (language === undefined) {
			const response = await prompts({
				type: 'select',
				name: 'language',
				message: `Select language of generated applet`,
				choices: [
					{ title: Language.TypeScript, value: Language.TypeScript },
					{ title: Language.JavaScript, value: Language.JavaScript },
				],
			});
			language = response.language;
		}
		const supportedLanguages = Object.values(Language);
		if (!language || !supportedLanguages.includes(language)) {
			throw new Error(`Missing or incorrect argument --language <${supportedLanguages.join('|')}>`);
		}

		// Git support select
		let git: GitOptions | undefined = options.git as GitOptions | undefined;
		if (git === undefined) {
			const response = await prompts({
				type: 'select',
				name: 'git',
				message: `Init applet as git repository`,
				choices: [
					{ title: GitOptions.No, value: GitOptions.No },
					{ title: GitOptions.Yes, value: GitOptions.Yes },
				],
			});
			git = response.git;
		}
		const supportedGitOptions = Object.values(GitOptions);
		if (!git || !supportedGitOptions.includes(git)) {
			throw new Error(`Missing or incorrect argument --git <${supportedGitOptions.join('|')}>`);
		}

		// Bundler select
		let bundler: Bundler | undefined = options.bundler?.toLowerCase() as Bundler | undefined;
		if (bundler === undefined) {
			bundler = Bundler.Webpack;
		}
		const appletRootDirectory = options['target-dir'] || path.join(currentDirectory, appletName);
		const appletRootDirectoryName = options['target-dir'] || appletName;

		// Merge dependencies
		const dependencies = [...COMMON_DEPENDENCIES, ...(bundler === Bundler.Esbuild ? ESBUILD_DEPENDENCIES : WEBPACK_DEPENDENCIES)];

		const webpackConfigParams = {
			entryFileName: 'index',
			fileExtensions: ['.js'],
			imports: [`const HtmlWebpackPlugin = require('html-webpack-plugin')`, `const SignageOSPlugin = require('@signageos/webpack-plugin')`],
			rules: [
				`			{
				test: /^(.(?!\\.module\\.css))*\\.css$/,
				use: ['style-loader', 'css-loader'],
			}`,
				`			{
				test: /\\.jsx?$/,
				loader: 'babel-loader',
				options: { presets: [require.resolve('@babel/preset-env')] },
				enforce: 'post',
			}`,
			],
			plugins: [
				`			new HtmlWebpackPlugin({
				template: 'public/index.html',
			})`,
				`			new SignageOSPlugin()`,
			],
		};

		if (language === Language.TypeScript) {
			webpackConfigParams.fileExtensions.unshift('.ts', '.tsx');
			webpackConfigParams.rules.push(`{ test: /\\.tsx?$/, loader: 'ts-loader' }`);
		}

		const bundlerConfig = {
			[Bundler.Webpack]: {
				path: path.join(appletRootDirectory, 'webpack.config.js'),
				content: createWebpackConfig(
					webpackConfigParams.entryFileName,
					webpackConfigParams.fileExtensions,
					webpackConfigParams.imports,
					webpackConfigParams.rules,
					webpackConfigParams.plugins,
				),
			},
			[Bundler.Esbuild]: {
				path: path.join(appletRootDirectory, 'esbuild.config.mjs'),
				content: createEsbuildConfig(),
			},
		};

		const generateFiles: IFile[] = [];

		if (language === Language.TypeScript) {
			dependencies.push('ts-loader@9', 'typescript');

			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.ts'),
				content: createIndexTs(),
			});
			generateFiles.push({
				path: path.join(appletRootDirectory, 'tsconfig.json'),
				content: createTsConfig(),
			});
		} else {
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.js'),
				content: createIndexJs(),
			});
		}

		if (git === GitOptions.Yes) {
			generateFiles.push({
				path: path.join(appletRootDirectory, '.gitignore'),
				content: 'node_modules/\n./dist',
			});
			initGitRepository(appletRootDirectory);
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
			content: JSON.stringify(await createPackageConfig(appletName, options['applet-version'], bundler), undefined, 2) + '\n',
		});
		generateFiles.push(bundlerConfig[bundler]);
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
		const child = child_process.spawn(NPM_EXECUTABLE, ['install', '--save-dev', ...dependencies], {
			stdio: 'inherit',
			shell: true,
		});

		child.on('close', () => {
			log('info', `\nApplet ${chalk.green(appletName!)} created!`);
			log('info', `use: cd ${chalk.green(appletRootDirectoryName!)} and ${chalk.green('npm start')}\n`);
		});
	},
});

async function createPackageConfig(name: string, version: string, bundler: Bundler) {
	return {
		name,
		version,
		main: 'dist/index.html',
		scripts: { ...COMMON_SCRIPTS, ...(bundler === Bundler.Esbuild ? ESBUILD_SCRIPTS : WEBPACK_SCRIPTS) },
		files: ['dist'],
		description: 'signageOS applet',
		repository: {},
		license: 'UNLICENSED',
	};
}

const createWebpackConfig = (entryFileName: string, fileExtensions: string[], imports: string[], rules: string[], plugins: string[]) => `
${imports.join(';\n')}

exports = module.exports = {
	entry: ${JSON.stringify('./src/' + entryFileName)},
	target: ${JSON.stringify(['web', 'es5'])},
	infrastructureLogging: {
		level: 'warn',
	},
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

// TODO fix esbuild config because it doesn't work. @signageos/lib/dist/ESBuild/Bundler.js and @signageos/lib/dist/ESBuild/utils/stopwatch.js are not public
const createEsbuildConfig = () => `
import { Bundler } from '@signageos/lib/dist/ESBuild/Bundler.js';
import { stopwatch } from '@signageos/lib/dist/ESBuild/utils/stopwatch.js';
import { context } from 'esbuild';

const bundler = new Bundler({
	outdir: './dist',
	parameters: {},
	argv: process.argv,
});

await stopwatch('Building the applet', [
	async () => {
		await stopwatch('Bundling', async () => {
			await bundler.writeIndexFile('./public/index.html');
			const ctx = await context({
				entryPoints: ['./src/index.ts'],
				outdir: './dist',
				platform: 'browser',
				bundle: true,
				minify: true,
			});
			await bundler.build(ctx);
		});
		await stopwatch('Transpiling to ES5', [
			bundler.transpileToES5({
				minify: true,
				env: {
					targets: {
						chrome: '28',
					},
				},
			}),
		]);
	},
]);
`;

const createIndexHtml = (title: string) => `<!DOCTYPE html>
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

const createIndexTs = () => createIndexJs(); // There is currently no differences

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

const createTsConfig = () => `{
	"compilerOptions": {
		"esModuleInterop": true,
		"downlevelIteration": true
	},
	"include": ["src/**/*.ts"]
}
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

const initGitRepository = (directoryPath: string): void => {
	const absolutePath = path.resolve(directoryPath);
	executeChildProcess(`git init "${absolutePath}"`, 'Git repository initialization failed');
};

const executeChildProcess = (command: string, errorMessage: string): void => {
	child_process.exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error(`${errorMessage}: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`Git commit stderr: ${stderr}`);
			return;
		}
		console.log(stdout);
	});
};
