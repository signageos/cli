import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { throwErrorIfGitNotInstalled } from '../../Lib/git';
import { addToConfigFile } from '../../CustomScript/customScriptFacade';
import { askForParameters, downloadBoilerplateCode } from './pluginGenerateFacade';
import { OPTION_LIST } from './pluginGenerateOptions';
export const pluginGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generates a local repository for developing a Plugin',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		await throwErrorIfGitNotInstalled();

		const skipConfirmation = !!options.yes;
		const { targetDir, name, description } = await askForParameters(options, skipConfirmation);

		await downloadBoilerplateCode(targetDir);
		await addToConfigFile(targetDir, { name, description });

		log('info', `Plugin ${chalk.green(name)} has been generated in ${chalk.green(targetDir)}.`);
		log('info', 'Next steps:');
		log('info', `  - Open the folder ${chalk.green(targetDir)} and read the ${chalk.green('README.md')} file.`);
	},
});
