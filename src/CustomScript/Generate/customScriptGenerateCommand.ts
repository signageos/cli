import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { addToConfigFile } from '../customScriptFacade';
import { askForParameters, downloadBoilerplateCode } from './customScriptGenerateFacade';
import { throwErrorIfGitNotInstalled } from '../../Lib/git';
import { OPTION_LIST } from './customScriptGenerateOptions';

/**
 * Creates a new custom script project with boilerplate code and configuration files.
 * Generates `.sosconfig.json`, platform directories, and sample implementations.
 *
 * Requires: name, description, dangerLevel (low/medium/high/critical).
 *
 * @group Development:21
 *
 * @example
 * ```bash
 * # Interactive generation
 * sos custom-script generate
 *
 * # Non-interactive (CI/CD)
 * sos custom-script generate --name brightness-control --description "Device brightness" --danger-level low --yes
 * ```
 *
 * @throws {Error} When git is not installed or parameters missing in non-interactive mode
 *
 * @see {@link https://developers.signageos.io/docs/custom-scripts/ Documentation}
 * @see {@link ../upload/ Upload command}
 *
 * @since 2.2.0
 */
export const customScriptGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generate a local repository for developing a Custom Script',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		await throwErrorIfGitNotInstalled();

		const skipConfirmation = !!options.yes;
		const { targetDir, name, description, dangerLevel } = await askForParameters(options, skipConfirmation);

		await downloadBoilerplateCode(targetDir);
		await addToConfigFile(targetDir, { name, description, dangerLevel });

		log('info', `Custom Script ${chalk.green(name)} has been generated in ${chalk.green(targetDir)}.`);
		log('info', 'Next steps:');
		log('info', `  - Open the folder ${chalk.green(targetDir)} and read the ${chalk.green('README.md')} file.`);
	},
});
