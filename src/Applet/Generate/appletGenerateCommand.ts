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
	Rspack = 'rspack',
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
	{ name: 'bundler', type: String, description: `Generate applet with "webpack" (default) or "rspack"` },
	{ name: 'git', type: String, description: `Init applet as git repository "no" (default) or "yes"` },
] as const;

const DEPENDENCIES = {
	common: [
		'@signageos/front-applet@latest',
		'@signageos/front-display@14',
		'@signageos/webpack-plugin@latest',
		'es-check@8',

		/* required for transpilation to ES5 */
		'@babel/core@7',
		'@babel/preset-env@7',
		'babel-loader@8',
		'css-loader@6',
		'style-loader@3',
		'core-js@3',
	],
	webpack: ['webpack@5', 'webpack-cli@4', 'webpack-dev-server@4', 'html-webpack-plugin@5'],
	rspack: ['@rspack/core@latest', '@rspack/cli@latest'],
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
		connect: 'echo "Deprecated command \"npm run connect\". Use \"npm run watch\" instead." && npm run watch',
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
 * Command definition for generating a new applet.
 * This command facilitates the creation of a basic applet sample with configurable options such as
 * language, bundler, git initialization, and npm registry. It generates the necessary files and
 * installs dependencies based on the selected options.
 * @param {Object} options - The options for generating the applet
 * @param {string} options.name - The name of the applet
 * @param {string} options.appletVersion - The version of the applet
 * @param {string} options.targetDir - The target directory for the applet
 * @param {string} options.npmRegistry - The npm registry URL
 * @param {string} options.language - The language of the applet (typescript or javascript)
 * @param {string} options.bundler - The bundler to use (webpack or rspack)
 * @param {string} options.git - Whether to initialize a git repository (yes or no)
 * @param {string} options.gitFound - Whether git is found on the machine
 * @returns {Promise<void>} - A promise that resolves when the applet is generated
 * @example
 * appletGenerate.run({
 *   name: 'my-applet',
 *   appletVersion: '1.0.0',
 *   targetDir: './output',
 *   npmRegistry: 'https://registry.npmjs.org/',
 *   language: 'typescript',
 *   bundler: 'webpack',
 *   git: 'yes',
 * });
 */
export const appletGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generate basic applet sample',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();

		// PROMPT: Applet Name
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
			throw new Error(`Name has to start and end with a character (a-zA-Z0-9_)\nRegExp: ${NAME_REGEXP.toString()}`);
		}

		// PROMPT: Language select
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
		checkSupport('language', language, Object.values(Language));

		// PROMPT: Git support select
		let git: GitOptions | undefined = options.git as GitOptions | undefined;
		let gitFound = await executeChildProcess('git --version', false).catch((err: string) => {
			console.error(`Git not found on this machine: ${err}`);
		});
		// PROMPT: Skip prompt if git was not found
		if (git === undefined && gitFound?.includes('git version')) {
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
		checkSupport('git', git, Object.values(GitOptions));

		// PROMPT: Bundler select
		let bundler: Bundler | undefined = options.bundler?.toLowerCase() as Bundler | undefined;
		if (bundler === undefined) {
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
		}
		checkSupport('bundler', bundler, Object.values(Bundler));

		const appletRootDirectory = options['target-dir'] || path.join(currentDirectory, appletName);
		const appletRootDirectoryName = options['target-dir'] || appletName;

		// Merge dependencies
		const mergedDeps = [...DEPENDENCIES.common];
		switch (bundler) {
			case Bundler.Webpack:
				mergedDeps.push(...DEPENDENCIES.webpack);
				break;
			case Bundler.Rspack:
				mergedDeps.push(...DEPENDENCIES.rspack);
				break;
			default:
				throw new Error(`Bundler ${bundler} is not supported`);
		}

		// Configure bundler
		const bundlerConfig = {
			[Bundler.Webpack]: {
				path: path.join(appletRootDirectory, 'webpack.config.js'),
				content: createWebpackConfig(),
			},
			[Bundler.Rspack]: {
				path: path.join(appletRootDirectory, 'rspack.config.mjs'),
				content: createRspackConfig(),
			},
		};

		// Create index files
		const generateFiles: IFile[] = [];

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
			mergedDeps.push('ts-loader@9', 'typescript@5', '@babel/preset-typescript@7', 'ts-node@10');
		} else {
			generateFiles.push({
				path: path.join(appletRootDirectory, 'src', 'index.js'),
				content: createIndexJs(),
			});
		}

		// Initialise git repository
		if (git === GitOptions.Yes && gitFound) {
			generateFiles.push({
				path: path.join(appletRootDirectory, '.gitignore'),
				content: 'node_modules/\n./dist',
			});
			initGitRepository(appletRootDirectory);
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
		if (options['npm-registry']) {
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

		// Install dependencies
		console.log('Installing dependencies:\n', mergedDeps);
		process.chdir(appletRootDirectory);
		const child = child_process.spawn(NPM_EXECUTABLE, ['install', '--save-dev', ...mergedDeps], {
			stdio: 'inherit',
			shell: true,
		});

		child.on('close', () => {
			log('info', `\nApplet ${chalk.green(appletName!)} created!`);
			log('info', `use: cd ${chalk.green(appletRootDirectoryName!)} and ${chalk.green('npm start')}\n`);
		});
	},
});

/**
 * Create package.json config
 */
const createPackageConfig = async (name: string, version: string, bundler: Bundler) => {
	let scriptDef = { ...RUNSCRIPTS.common };
	switch (bundler) {
		case Bundler.Webpack:
			scriptDef = { scriptDef, ...RUNSCRIPTS.webpack };
			break;
		case Bundler.Rspack:
			scriptDef = { scriptDef, ...RUNSCRIPTS.rspack };
			break;
		default:
			throw new Error(`Bundler ${bundler} is not supported`);
	}

	return {
		name,
		version,
		main: 'dist/index.html',
		scripts: scriptDef,
		files: ['dist'],
		description: 'signageOS applet',
		repository: {},
		license: 'UNLICENSED',
	};
};

const createWebpackConfig = () => importFileAsString('./Templates/webpack.config.js.template');
const createRspackConfig = () => importFileAsString('./Templates/rspack.config.mjs.template');
const createIndexHtml = (title: string): string => {
	return importFileAsString('./Templates/index.html.template').replaceAll('${title}', title);
};
const createIndexCss = () => importFileAsString('./Templates/index.css.template');
const createIndexJs = () => importFileAsString('./Templates/index.js.template');
const createIndexTs = () => createIndexJs(); // There is currently no differences
const createTsConfig = () => importFileAsString('./Templates/tsconfig.js.template');

const createNpmRunControl = (registryUrl: string) => `
registry=${registryUrl}
always-auth=true
`;

/**
 * Initialize a git repository in the specified directory
 * @param directoryPath - The path to the directory where the git repository should be initialized
 */
const initGitRepository = (directoryPath: string): void => {
	const absolutePath = path.resolve(directoryPath);
	executeChildProcess(`git init "${absolutePath}"`, true).catch((err: string) => {
		console.error(`Git repository initialization failed: ${err}`);
	});
};

/**
 * Execute a child process command
 * @param command
 * @param verbose
 * @returns Promise<string>
 */
const executeChildProcess = (command: string, verbose: boolean): Promise<string> => {
	return new Promise((resolve, reject) => {
		child_process.exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error.message);
			} else if (stderr) {
				reject(stderr);
			} else {
				if (verbose) {
					console.log(stdout);
				}
				resolve(stdout);
			}
		});
	});
};

/**
 * Check if the value is present and is one of the supported options
 * @param propName - The name of the property to check
 * @param value - The value to check
 * @param options - The supported options
 * @throws Will throw an error if the value is not present or not one of the supported options
 */
const checkSupport = (propName: string, value: any, options: Object) => {
	const values = Object.values(options);
	if (!value || !values.includes(value)) {
		throw new Error(`Missing or incorrect argument --${propName} <${values.join('|')}>`);
	}
};
