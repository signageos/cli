import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { createCommandDefinition } from '../../Command/commandDefinition';
import { throwErrorIfGitNotInstalled } from '../../Lib/git';
import { addToConfigFile } from '../../CustomScript/customScriptFacade';
import { askForParameters, downloadBoilerplateCode } from './pluginGenerateFacade';

export const pluginGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generates a local repository for developing a Plugin',
	optionList: [],
	commands: [],
	async run() {
		await throwErrorIfGitNotInstalled();

		const { targetDir, name, description } = await askForParameters();

		await downloadBoilerplateCode(targetDir);
		await addToConfigFile(targetDir, { name, description });

		log('info', `Plugin ${chalk.green(name)} has been generated in ${chalk.green(targetDir)}.`);
		log('info', 'Next steps:');
		log('info', `  - Open the folder ${chalk.green(targetDir)} and read the ${chalk.green('README.md')} file.`);
	},
});
