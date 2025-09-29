import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import chalk from 'chalk';
import * as path from 'path';
import prompts from 'prompts';
import { log } from '@signageos/sdk/dist/Console/log';
import { initGitRepository } from '../../Lib/git';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import which from 'which';

enum Language {
	JavaScript = 'javascript',
	TypeScript = 'typescript',
}

enum Bundler {
	Webpack = 'webpack',
	Rspack = 'rspack',
}

enum GitOptions {
	No = 'no',
	Yes = 'yes',
}

enum Packager {
	Npm = 'npm',
	Pnpm = 'pnpm',
	Yarn = 'yarn',
	Bun = 'bun',
}

const NAME_REGEXP = /^\w(\w|\d|-)*\w$/;
let PACKAGER_EXECUTABLE = 'npm';

interface IFile {
	path: string;
	content: string;
}
interface ScriptDefinition {
	prepare: string;
	upload: string;
	clean: string;
	escheck: string;
	postbuild: string;
	build?: string;
	start?: string;
	connect?: string;
	watch?: string;
	'check-types'?: string;
}

const OPTION_LIST = [
	{ name: 'name', type: String, description: `Applet name. Match RegExp: /^\\w(\\w|\\d|-)*\\w$/` },
	{ name: 'applet-version', type: String, description: 'Applet initial version. Use semantic version', defaultValue: '0.0.0' },
	{ name: 'target-dir', type: String, description: 'Directory where will be the applet generated to' },
	{ name: 'git', type: String, description: 'Init applet as git repository "no" (default) or "yes"' },
	{ name: 'packager', type: String, description: 'Use preferred package manager "npm" (default), "pnpm", "yarn" or "bun"' },
	{ name: 'npm-registry', type: String, description: 'NPM registry URL. If you have your private npm registry' },
	{ name: 'language', type: String, description: 'Generate applet with "typescript" or "javascript" source code' },
	{ name: 'bundler', type: String, description: 'Generate applet with "webpack" (default) or "rspack"' },
];

const DEPENDENCIES = {
	common: [
		'@signageos/front-applet@latest',
		'@signageos/front-display@latest',
		'@signageos/webpack-plugin@latest',
		'es-check@9',

		/* required for transpilation to ES5 */
		'css-loader@7',
		'style-loader@4',
		'core-js@3',
	],
	webpack: [
		'webpack@5',
		'webpack-cli@6',
		'webpack-dev-server@5',
		'html-webpack-plugin@5',
		'babel-loader@10',
		'@babel/core@7',
		'@babel/preset-env@7',
	],
	rspack: ['@rspack/core@1.4.11', '@rspack/cli@1.4.11'],
};

const RUNSCRIPTS = {
	common: {
		prepare: 'npm run clean && npm run build',
		upload: 'sos applet upload',
		clean: 'npx rimraf dist',
		escheck: 'npx es-check --module es5 dist/**/*.js',
		postbuild: 'npm run escheck',
	},
	webpack: {
		start: 'webpack serve --mode development',
		build: 'webpack --mode production',
		connect: 'echo "Deprecated command \\"npm run connect\\". Use \\"npm run watch\\" instead." && npm run watch',
		watch: 'webpack --watch',
	},
	rspack: {
		start: 'rspack serve',
		build: 'rspack build',
	},
};

/**
 * Import a file as a string
 * @param relativePath
 * @returns	string
 * @throws Will throw an error if the file does not exist
 */
const importFileAsString = (relativePath: string): string => {
	return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf-8');
};

/**
 * Creates a new applet project with all necessary configuration files, dependencies,
 * and boilerplate code. Supports both TypeScript and JavaScript, multiple bundlers
 * (webpack/rspack), various package managers (npm/pnpm/yarn/bun), and includes
 * git repository initialization.
 *
 * @group Development:11
 *
 * @example
 * ```bash
 * # Interactive generation with prompts
 * sos applet generate
 *
 * # Generate TypeScript applet with webpack
 * sos applet generate --name my-applet --language typescript --bundler webpack
 *
 * # Generate with custom settings
 * sos applet generate --name my-app --target-dir ./projects --git yes --packager pnpm
 *
 * # Generate with npm registry
 * sos applet generate --name my-applet --npm-registry https://registry.npmjs.org/ --packager npm
 *
 * # Generate applet with specific configuration
 * sos applet generate --name my-applet --applet-version 1.0.0 --target-dir ./output --language typescript --bundler webpack --git yes
 * ```
 *
 * @throws {Error} When required parameters are missing or invalid
 *
 * @throws {Error} When target directory conflicts exist
 *
 * @since 0.1.0
 */
export const appletGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generate new signageOS applet projects with boilerplate code',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();

		// Detect if the command has been called with optional parameters
		const excludedKeys = ['command', 'applet-version'];
		const argumentsFound =
			Object.entries(options)
				.filter(([key]) => !excludedKeys.includes(key))
				.map(([key, value]) => ({ [key]: value })).length > 0;
		console.info('sOS CLI started with params:', options);

		// Create file index
		const generateFiles: IFile[] = [];

		// PROMPT: Applet Name
		let appletName: string | undefined = typeof options.name === 'string' ? options.name : undefined;
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
			throw new Error(`Name has to start and end with a character (a-zA-Z0-9_)\nRegExp: ${NAME_REGEXP.toString()}`);
		}

		// PROMPT: Language select
		let language: string | undefined;
		if (options.language === undefined) {
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
		} else {
			language = typeof options.language === 'string' ? options.language.toLowerCase() : Language.TypeScript;
		}
		checkSupport('language', language, Object.values(Language));

		// PROMPT: Git support select
		let git: string | undefined;

		const gitFound = await which('git', { nothrow: true });
		if (!gitFound) {
			console.error(`Git not found on this machine`);
		}

		// PROMPT: Skip prompt if git was not found
		if (options.git === undefined && gitFound && !argumentsFound) {
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
		} else {
			git = typeof options.git === 'string' ? options.git.toLowerCase() : GitOptions.No;
		}
		checkSupport('git', git, Object.values(GitOptions));

		// PROMPT: Bundler select
		let bundler: string | undefined;
		if (options.bundler === undefined) {
			const response = await prompts({
				type: 'select',
				name: 'bundler',
				message: `Select bundler of generated applet`,
				choices: [
					{ title: Bundler.Webpack, value: Bundler.Webpack },
					{ title: Bundler.Rspack, value: Bundler.Rspack },
				],
			});
			bundler = response.bundler;
		} else {
			bundler = typeof options.bundler === 'string' ? options.bundler.toLowerCase() : Bundler.Webpack;
		}
		checkSupport('bundler', bundler, Object.values(Bundler));

		const targetDir = typeof options['target-dir'] === 'string' ? options['target-dir'] : undefined;
		const appletRootDirectory = targetDir || path.join(currentDirectory, appletName);
		const appletRootDirectoryName = targetDir || appletName;

		// Merge dependencies
		const mergedDeps = [...DEPENDENCIES.common];
		switch (bundler) {
			case Bundler.Rspack:
				mergedDeps.push(...DEPENDENCIES.rspack);
				break;
			case Bundler.Webpack:
				mergedDeps.push(...DEPENDENCIES.webpack);
				break;
			default:
				console.warn(`Unknown bundler ${bundler}. No additional dependencies added.`);
		}

		// PROMPT: Package manager select
		let packager: string | undefined;
		if (options.packager === undefined) {
			const response = await prompts({
				type: 'select',
				name: 'packager',
				message: `Select preferred package manager`,
				choices: [
					{ title: Packager.Npm, value: Packager.Npm },
					{ title: Packager.Pnpm, value: Packager.Pnpm },
					{ title: Packager.Yarn, value: Packager.Yarn },
					{ title: Packager.Bun, value: Packager.Bun },
				],
			});
			packager = response.packager;
		} else {
			packager = typeof options.packager === 'string' ? options.packager.toLowerCase() : Packager.Npm;
		}
		checkSupport('packager', packager, Object.values(Packager));

		switch (packager) {
			case Packager.Pnpm:
				PACKAGER_EXECUTABLE = 'pnpm';
				RUNSCRIPTS.common = {
					prepare: 'pnpm run clean && pnpm run build',
					upload: 'sos applet upload',
					clean: 'pnpx rimraf dist',
					escheck: 'pnpx es-check --module es5 "./dist/**/*.js"',
					postbuild: 'pnpm run escheck',
				};
				break;
			case Packager.Yarn:
				PACKAGER_EXECUTABLE = 'yarn';
				RUNSCRIPTS.common = {
					prepare: 'yarn run clean && yarn run build',
					upload: 'sos applet upload',
					clean: 'npx rimraf dist',
					escheck: 'npx es-check --module es5 "./dist/**/*.js"',
					postbuild: 'npm run escheck',
				};
				break;
			case Packager.Bun:
				PACKAGER_EXECUTABLE = 'bun';
				RUNSCRIPTS.common = {
					prepare: 'bun run clean && bun run build',
					upload: 'sos applet upload',
					clean: 'bunx rimraf dist',
					escheck: 'bunx es-check --module es5 "./dist/**/*.js"',
					postbuild: 'bun run escheck',
				};
				break;
			default:
		}
		generateFiles.push({
			path: path.join(appletRootDirectory, '.npmrc'),
			content: 'registry=https://registry.npmjs.org/\nalways-auth=false',
		});

		// TypeScript or JavaScript
		if (language === Language.TypeScript) {
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.ts'),
				content: createIndexTs(),
			});
			generateFiles.push({
				path: path.join(appletRootDirectory, 'tsconfig.json'),
				content: createTsConfig(),
			});
			// Extend dependencies for Typescript
			mergedDeps.push('typescript@5');

			// Extend dependencies for Webpack
			if (bundler === Bundler.Webpack) {
				mergedDeps.push('ts-loader@9', '@babel/preset-typescript@7', 'ts-node@10');
			}
		} else {
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.js'),
				content: createIndexJs(),
			});
		}

		// Create styles
		// TODO sass support
		{
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.css'),
				content: createIndexCss(),
			});
		}
		// Create custom npm registry config
		if (typeof options['npm-registry'] === 'string') {
			generateFiles.push({
				path: path.join(appletRootDirectory, '.npmrc'),
				content: createNpmRunControl(options['npm-registry']),
			});
		}
		if (!options['applet-version']) {
			throw new Error('Argument --applet-version is required');
		}

		// Add files to project
		generateFiles.push({
			path: path.join(appletRootDirectory, 'package.json'),
			content:
				JSON.stringify(await createPackageConfig(appletName, String(options['applet-version']), bundler, language), undefined, 2) + '\n',
		});

		generateFiles.push({
			path: path.join(appletRootDirectory, 'CHANGELOG.md'),
			content: createChangelogFile(),
		});

		generateFiles.push({
			path: path.join(appletRootDirectory, 'README.md'),
			content: createReadmeFile(),
		});

		// Configure bundler
		switch (bundler) {
			case Bundler.Rspack:
				generateFiles.push({
					path: path.join(appletRootDirectory, 'rspack.config.mjs'),
					content: createRspackConfig(),
				});
				break;
			case Bundler.Webpack:
				generateFiles.push({
					path: path.join(appletRootDirectory, 'webpack.config.js'),
					content: createWebpackConfig(),
				});
				break;
			default:
				throw new Error('Argument --bundler is required');
		}

		generateFiles.push({
			path: path.join(appletRootDirectory, 'public', 'index.html'),
			content: createIndexHtml(appletName),
		});
		generateFiles.push({
			path: path.join(appletRootDirectory, '.sosignore'),
			content: 'node_modules/\n',
		});

		// Initialise git repository
		if (git === GitOptions.Yes && gitFound) {
			generateFiles.push({
				path: path.join(appletRootDirectory, '.gitignore'),
				content: 'node_modules/\n./dist',
			});

			await initGitRepository(appletRootDirectory, true).catch((error) => {
				console.error(`Git repository initialization failed: ${error}`);
			});
		}

		// Create applet directory
		for (const generateFile of generateFiles) {
			await fs.ensureDir(path.dirname(generateFile.path));
			await fs.writeFile(generateFile.path, generateFile.content);
		}

		console.info(`Loooking for ${PACKAGER_EXECUTABLE}`);
		const packagerFound = await which(PACKAGER_EXECUTABLE).catch((err: string) => {
			console.error(`${PACKAGER_EXECUTABLE} not found on this machine: ${err}`);
		});

		if (packagerFound) {
			// Install dependencies
			process.chdir(appletRootDirectory);

			// Ensure the default .npmrc file will be loaded from project root
			// Yarn 2+ uses .yarnrc.yml, but we can use this flag to override user's .npmrc
			const packagerPrefix = ''; // 'NPM_CONFIG_USERCONFIG=/dev/null';

			// Apply packager specific options
			let configFlag: string = '';
			switch (packager) {
				case Packager.Yarn:
					// Prevent Yarn from automatically detecting yarnrc and npmrc files
					configFlag = '--no-default-rc';
					break;
				case Packager.Bun:
					// Prevent Bun from failing on issues related to lockfile permissions
					configFlag = '--frozen-lockfile';
					break;
				default:
				// Other packagers (npm, pnpm) currently do not require any special config
			}

			const installCommand = packager === Packager.Yarn ? 'add' : 'install';

			// Log the command being executed
			console.info(
				`Installing dependencies: ${packagerPrefix} ${PACKAGER_EXECUTABLE} ${installCommand} ${configFlag} --save-dev ${mergedDeps.join(' ')}`,
			);

			const child = child_process.spawn(PACKAGER_EXECUTABLE, [packagerPrefix, installCommand, configFlag, '--save-dev', ...mergedDeps], {
				stdio: 'pipe', // Use 'pipe' to capture stdout and stderr
				shell: true,
			});

			// Capture and log stdout
			child.stdout.on('data', (data) => {
				console.info(`${data.toString()}`);
			});

			// Capture and log stderr
			child.stderr.on('data', (data) => {
				console.error(`${data.toString()}`);
			});

			// Handle errors
			child.on('error', (error) => {
				console.error(`Error executing command: ${error.message}`);
			});

			// Handle process exit
			child.on('close', (code) => {
				if (code === 0) {
					log('info', `\nApplet ${chalk.green(appletName!)} created!`);
					log(
						'info',
						`\nContinue with ${chalk.green(`cd ${appletRootDirectoryName}`!)} and ${chalk.green(`${PACKAGER_EXECUTABLE} start`)}`,
					);
				} else {
					console.error(`Command exited with code ${code}`);
				}
			});
		} else {
			log(
				'info',
				`${chalk.red(`Please first install ${PACKAGER_EXECUTABLE} globally.`)}\nContinue with ${chalk.green(`cd ${appletRootDirectoryName}`!)}, ${chalk.green(`${PACKAGER_EXECUTABLE} install`)} and ${chalk.green(`${PACKAGER_EXECUTABLE} start`)}`,
			);
			log('info', `\nApplet ${chalk.white(appletName!)} created!`);
		}
	},
});

/**
 * Create package.json config
 */
const createPackageConfig = async (name: string, version: string, bundler: Bundler | undefined, language: Language) => {
	// Define type for script definition to avoid TypeScript errors
	let scriptDef: ScriptDefinition = { ...RUNSCRIPTS.common };
	switch (bundler) {
		case Bundler.Rspack:
			scriptDef = { ...scriptDef, ...RUNSCRIPTS.rspack };
			break;
		case Bundler.Webpack:
		default:
			scriptDef = { ...scriptDef, ...RUNSCRIPTS.webpack };
	}

	// Add typescript checking before builds
	if (language === Language.TypeScript) {
		scriptDef['check-types'] = 'tsc --noEmit';
		// Make sure build exists before modifying it
		if (scriptDef.build) {
			scriptDef.build = `npm run check-types && ${scriptDef.build}`;
		}
	}

	return {
		name,
		version,
		author: '',
		main: 'dist/index.html',
		scripts: scriptDef,
		files: ['dist', 'CHANGELOG.md', 'README.md'],
		description: 'signageOS applet',
		repository: {},
		license: 'UNLICENSED',
	};
};

const createWebpackConfig = () => importFileAsString('./Templates/webpack.config.js.template');
const createRspackConfig = () => importFileAsString('./Templates/rspack.config.mjs.template');
const createIndexHtml = (title: string): string => {
	return importFileAsString('./Templates/index.html.template').replace(/\$\{title\}/g, title);
};
const createIndexCss = () => importFileAsString('./Templates/index.css.template');
const createIndexJs = () => importFileAsString('./Templates/index.js.template');
const createIndexTs = () => createIndexJs(); // There is currently no difference
const createTsConfig = () => importFileAsString('./Templates/tsconfig.js.template');

const createChangelogFile = () => importFileAsString('./Templates/CHANGELOG.md.template');
const createReadmeFile = () => importFileAsString('./Templates/README.md.template');

const createNpmRunControl = (registryUrl: string) => `
registry=${registryUrl}
always-auth=true
`;

/**
 * Check if the value is present and is one of the supported options
 * @param propName - The name of the property to check
 * @param value - The value to check
 * @param {Object} options - The supported options
 * @throws Will throw an error if the value is not present or not one of the supported options
 */
function checkSupport<T extends string>(propName: string, value: unknown, options: T[]): asserts value is T {
	const values = Object.values(options);
	if (!value || !values.includes(value as T)) {
		throw new Error(`Missing or incorrect argument --${propName} <${values.join('|')}>`);
	}
}
