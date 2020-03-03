import * as Debug from 'debug';
import chalk from 'chalk';
import * as cliUsage from 'command-line-usage';
import * as cliArgs from 'command-line-args';
import ICommand, { ICommandOption } from './ICommand';
import * as parameters from '../../config/parameters';
import { printVersion } from '../Cli/packageVersion';
const debug = Debug('@signageos/cli:Command:processor');

export const API_URL_OPTION = {
	name: 'api-url',
	alias: 'u',
	type: String,
	defaultValue: parameters.apiUrl,
	description: 'API URL to be used for REST requests',
};

export async function processCommand(currentCommand: ICommand, parentOptionList: ICommandOption[] = [], commandIndex: number = 0) {
	const nestedOptionList = [...parentOptionList, ...currentCommand.optionList];
	const currentOptions = cliArgs(nestedOptionList, { partial: true });
	debug('process', currentOptions);

	const subCommandName = currentOptions.command[commandIndex];
	const subCommand = currentCommand.commands.find((command: ICommand) => command.name === subCommandName);

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
				await currentCommand.run(currentOptions);
			} catch (error) {
				console.error(chalk.red(error.message));
				printUsage(currentCommand, nestedOptionList);
				process.exit(1);
			}
		}
	}
}

export function getGlobalApiUrl(): string {
	const options = cliArgs([API_URL_OPTION], { partial: true });
	return options['api-url'];
}

function printUsage(
	currentCommand: ICommand,
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
