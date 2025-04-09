import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { createCommandDefinition } from '../../Command/commandDefinition';
import { addToConfigFile } from '../customScriptFacade';
import { askForParameters, downloadBoilerplateCode } from './customScriptGenerateFacade';
import { throwErrorIfGitNotInstalled } from '../../Lib/git';

export const customScriptGenerate = createCommandDefinition({
	name: 'generate',
	description: 'Generates a local repository for developing a Custom Script',
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
