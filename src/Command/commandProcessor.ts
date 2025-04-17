import logger from 'debug';
import chalk from 'chalk';
import cliUsage from 'command-line-usage';
import cliArgs from 'command-line-args';
import { printVersion, newVersionAvailable, getUpdateVersionMessage } from '../Cli/packageVersion';
import { ICommand, ICommandOption, OptionList } from './commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';
const debugLog = logger('@signageos/cli:Command:processor');

export async function processCommand(
	currentCommand: ICommand<string, OptionList>,
	parentOptionList: ICommandOption[] = [],
	commandIndex: number = 0,
) {
	const nestedOptionList = [...parentOptionList, ...currentCommand.optionList];
	const currentOptions = cliArgs(nestedOptionList, { partial: true });
	debugLog('process', currentOptions);

	const subCommandName = currentOptions.command[commandIndex];
	const subCommand = currentCommand.commands.find((command: ICommand<string, OptionList>) => command.name === subCommandName);

	if (subCommand) {
		await processCommand(subCommand, nestedOptionList, commandIndex + 1);
	} else {
		if (currentOptions.help) {
			printUsage(currentCommand, nestedOptionList);
		} else if (currentOptions.version) {
			await printVersion();
		} else {
			try {
				const newVer: boolean = await newVersionAvailable();

				if (newVer) {
					log('info', getUpdateVersionMessage());
				}
				await currentCommand.run(currentOptions);
			} catch (error: any) {
				log('error', error.message);
				printUsage(currentCommand, nestedOptionList);
				process.exit(1);
			}
		}
	}
}

function printUsage(currentCommand: ICommand<string, OptionList>, optionList: ICommandOption[]) {
	log('info', chalk.bold(currentCommand.name));
	log('info', '  - ' + chalk.italic(currentCommand.description), '');
	for (const command of currentCommand.commands) {
		log('info', '  ' + chalk.bold(command.name));
		log('info', '    - ' + chalk.italic(command.description), '');
	}
	const usage = cliUsage({
		optionList,
	});
	log('info', usage);
}
