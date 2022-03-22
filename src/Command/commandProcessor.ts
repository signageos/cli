import * as Debug from 'debug';
import chalk from 'chalk';
import * as cliUsage from 'command-line-usage';
import * as cliArgs from 'command-line-args';
import {
	printVersion,
	newVersionAvailable,
	getUpdateVersionMessage,
} from '../Cli/packageVersion';
import { ICommand, ICommandOption, OptionList } from './commandDefinition';
const debug = Debug('@signageos/cli:Command:processor');

export async function processCommand(
	currentCommand: ICommand<string, OptionList>,
	parentOptionList: ICommandOption[] = [],
	commandIndex: number = 0,
) {
	const nestedOptionList = [...parentOptionList, ...currentCommand.optionList];
	const currentOptions = cliArgs(nestedOptionList, { partial: true });
	debug('process', currentOptions);

	const subCommandName = currentOptions.command[commandIndex];
	const subCommand = currentCommand.commands.find((command: ICommand<string, OptionList>) => command.name === subCommandName);

	if (subCommand) {
		await processCommand(subCommand, nestedOptionList, commandIndex + 1);
	} else {

		if (currentOptions.help) {
			printUsage(currentCommand, nestedOptionList);
		} else
		if (currentOptions.version) {
			await printVersion();
		} else {

			try {
				const newVer: boolean = await newVersionAvailable();

				if (newVer) {
					console.info(getUpdateVersionMessage());
				}
				await currentCommand.run(currentOptions);
			} catch (error) {
				console.error(chalk.red(error.message));
				printUsage(currentCommand, nestedOptionList);
				process.exit(1);
			}
		}
	}
}

function printUsage(
	currentCommand: ICommand<string, OptionList>,
	optionList: ICommandOption[],
) {
	console.log(chalk.bold(currentCommand.name));
	console.log('  - ' + chalk.italic(currentCommand.description));
	console.log();
	for (const command of currentCommand.commands) {
		console.log('  ' + chalk.bold(command.name));
		console.log('    - ' + chalk.italic(command.description));
		console.log();
	}
	const usage = cliUsage({
		optionList,
	});
	console.log(usage);
}
