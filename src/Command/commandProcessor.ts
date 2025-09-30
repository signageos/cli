import debug from 'debug';
import chalk from 'chalk';
import cliUsage from 'command-line-usage';
import cliArgs from 'command-line-args';
import { printVersion, newVersionAvailable, getUpdateVersionMessage } from '../Cli/packageVersion';
import { ICommand, ICommandOption, OptionList } from './commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';
const Debug = debug('@signageos/cli:Command:processor');

// Preprocess argv to detect and handle multi-character single-dash options
export function preprocessArgv(argv: string[]): string[] {
	// Common multi-character options that users might accidentally use with single dash
	const commonMultiCharOptions = ['yes', 'help', 'version', 'force', 'verbose'];

	return argv.map((arg) => {
		if (arg.startsWith('-') && !arg.startsWith('--') && arg.length > 2) {
			const optionName = arg.substring(1);

			// Throw error for common mistakes to educate users about correct syntax
			if (commonMultiCharOptions.includes(optionName)) {
				throw new Error(`Invalid option '${arg}'. Did you mean '--${optionName}'? Use double dashes for multi-character options.`);
			}

			// Convert multi-character options to double-dash to avoid cryptic errors
			return '--' + optionName;
		}
		return arg;
	});
}

export async function processCommand(
	currentCommand: ICommand<string, OptionList>,
	parentOptionList: ICommandOption[] = [],
	commandIndex: number = 0,
) {
	const nestedOptionList = [...parentOptionList, ...currentCommand.optionList];

	// Preprocess argv to handle multi-character single-dash options that should be treated as unknown
	// rather than being split into individual characters
	const preprocessedArgv = preprocessArgv(process.argv);
	const originalArgv = process.argv;
	process.argv = preprocessedArgv;

	// Parse command line options
	const currentOptions = cliArgs(nestedOptionList, { partial: true });

	// Restore original argv
	process.argv = originalArgv;
	Debug('process', currentOptions);

	const subCommandName = currentOptions.command[commandIndex];
	const subCommand = currentCommand.commands.find((command: ICommand<string, OptionList>) => command.name === subCommandName);

	if (subCommand) {
		await processCommand(subCommand, nestedOptionList, commandIndex + 1);
	} else {
		// Only validate unknown options when we're at a leaf command (no subcommands to process)
		// Validate unknown options - but handle the case where single-dash multi-char options
		// are split into individual characters by command-line-args
		if (currentOptions._unknown && currentOptions._unknown.length > 0) {
			const unknownOptions = currentOptions._unknown.filter((opt: string) => opt.startsWith('-'));
			if (unknownOptions.length > 0) {
				// Get the remaining args after the commands (skip the command path)
				const originalArgs = process.argv.slice(2);
				const commandArgs = currentOptions.command || [];
				const optionArgs = originalArgs.slice(commandArgs.length);
				Debug('originalArgs', originalArgs);
				Debug('commandArgs', commandArgs);
				Debug('optionArgs', optionArgs);
				const realUnknownOptions: string[] = [];

				// Find actual unknown options in the remaining arguments
				for (const arg of optionArgs) {
					if (arg.startsWith('-') && !arg.startsWith('--')) {
						// This is a single-dash option, check if it's known
						const optionName = arg.substring(1);
						const knownOption = nestedOptionList.find((opt) => opt.alias === optionName || opt.name === optionName);
						if (!knownOption && optionName.length > 1) {
							// This is an unknown multi-character single-dash option
							realUnknownOptions.push(arg);
						}
					} else if (arg.startsWith('--')) {
						// This is a double-dash option, check if it's known
						const optionName = arg.substring(2);
						const knownOption = nestedOptionList.find((opt) => opt.name === optionName);
						if (!knownOption) {
							realUnknownOptions.push(arg);
						}
					}
				}

				// If we found actual unknown options, use those instead
				if (realUnknownOptions.length > 0) {
					throw new Error(`Unknown option(s): ${realUnknownOptions.join(', ')}`);
				} else if (unknownOptions.length > 0) {
					// Fall back to the parsed unknown options if we couldn't determine the real ones
					throw new Error(`Unknown option(s): ${unknownOptions.join(', ')}`);
				}
			}
		}

		// Check if there was an unknown subcommand provided
		if (subCommandName && currentCommand.commands.length > 0) {
			throw new Error(`Unknown command: '${subCommandName}'`);
		}

		// Check if there are extra arguments when no subcommands are expected
		if (subCommandName && currentCommand.commands.length === 0) {
			throw new Error(`Unknown argument: '${subCommandName}'. This command does not accept subcommands.`);
		}

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
