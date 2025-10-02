import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { throwErrorIfGitNotInstalled } from '../../Lib/git';
import { addToConfigFile } from '../../CustomScript/customScriptFacade';
import { askForParameters, downloadBoilerplateCode } from './runnerGenerateFacade';
import { OPTION_LIST } from './runnerGenerateOptions';

/**
 * Generates a local repository for developing a Runner with boilerplate code and configuration files.
 * Sets up complete development environment with necessary dependencies and project structure.
 *
 * Runs interactively by default or non-interactively with `--yes` option.
 * Requires Git to be installed and accessible.
 *
 * @group Development:41
 *
 * @example
 * ```bash
 * # Generate runner project interactively
 * sos runner generate
 *
 * # Generate non-interactively (suitable for CI/CD)
 * sos runner generate --name my-runner --description "My custom runner" --yes
 * ```
 *
 * @since 2.6.0
 */
export const runnerGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generates a local repository for developing a Runner',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		await throwErrorIfGitNotInstalled();

		const skipConfirmation = !!options.yes;
		const { targetDir, name, description } = await askForParameters(options, skipConfirmation);

		await downloadBoilerplateCode(targetDir);
		await addToConfigFile(targetDir, { name, description });

		log('info', `Runner ${chalk.green(name)} has been generated in ${chalk.green(targetDir)}.`);
		log('info', 'Next steps:');
		log('info', `  - Open the folder ${chalk.green(targetDir)} and read the ${chalk.green('README.md')} file.`);
	},
});
