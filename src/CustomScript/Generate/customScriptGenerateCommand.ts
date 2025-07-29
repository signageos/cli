import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { createCommandDefinition } from '../../Command/commandDefinition';
import { addToConfigFile } from '../customScriptFacade';
import { askForParameters, downloadBoilerplateCode } from './customScriptGenerateFacade';
import { throwErrorIfGitNotInstalled } from '../../Lib/git';

/**
 * Creates a new custom script project with boilerplate code and configuration files.
 * This command sets up a complete development environment for custom script development,
 * including necessary dependencies and project structure.
 *
 * @group Development:1
 *
 * @example
 * ```bash
 * # Generate custom script project
 * sos custom-script generate
 * ```
 *
 * @see {@link https://developers.signageos.io/docs/custom-scripts/ Custom Scripts Documentation}
 *
 * @see {@link ../upload/ Upload custom script command}
 *
 * @since 2.2.0
 */
export const customScriptGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generate a local repository for developing a Custom Script',
	optionList: [],
	commands: [],
	async run() {
		await throwErrorIfGitNotInstalled();

		const { targetDir, name, description, dangerLevel } = await askForParameters();

		await downloadBoilerplateCode(targetDir);
		await addToConfigFile(targetDir, { name, description, dangerLevel });

		log('info', `Custom Script ${chalk.green(name)} has been generated in ${chalk.green(targetDir)}.`);
		log('info', 'Next steps:');
		log('info', `  - Open the folder ${chalk.green(targetDir)} and read the ${chalk.green('README.md')} file.`);
	},
});
