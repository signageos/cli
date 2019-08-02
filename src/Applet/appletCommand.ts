import * as Debug from 'debug';
import ICommand from "../Command/ICommand";
import * as cliArgs from 'command-line-args';
import { CommandLineOptions } from "command-line-args";
import { appletGenerate } from './Generate/appletGenerateCommand';
import { generalOptionList, printUsage } from '../Command/usage';
const debug = Debug('@signageos/cli:applet');

export const applet: ICommand = {
	name: 'applet',
	optionList: [
		{ name: 'applet-uid', alias: 'i', type: String, description: 'Applet UID' },
	],
	commands: [
		appletGenerate,
	],
	async run(options: CommandLineOptions) {
		debug('Applet command');
		const [, commandName] = options.command;
		const currentCommand = this.commands.find((command: ICommand) => command.name === commandName);
		if (currentCommand) {
			const currentOptionList = [...this.optionList, ...currentCommand.optionList];
			const commandOptions = cliArgs([...generalOptionList, ...currentOptionList]);
			debug('Command options', commandOptions);

			if (options.help) {
				printUsage(currentOptionList);
			} else {
				try {
					await currentCommand.run(commandOptions);
				} catch (error) {
					console.error(error.message);
					printUsage(currentOptionList);
					process.exit(1);
				}
			}
		} else {
			printUsage(this.optionList);
			process.exit(1);
		}
	},
};
