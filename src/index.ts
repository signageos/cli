#!/usr/bin/env node

import * as Debug from 'debug';
import * as cliArgs from 'command-line-args';
import ICommand from './Command/ICommand';
import { printUsage, generalCommands, getOptionListRecursive } from './Command/usage';
const debug = Debug('@signageos/cli:index');

const generalOptions = cliArgs(getOptionListRecursive());

debug('Options', generalOptions);

const [commandName] = generalOptions.command;

const currentCommand = generalCommands.find((command: ICommand) => command.name === commandName);

async function run() {
	if (currentCommand) {
		const commandOptions = cliArgs(getOptionListRecursive());
		debug('Command options', commandOptions);

		if (generalOptions.help) {
			printUsage(currentCommand.optionList);
		} else {
			try {
				await currentCommand.run(commandOptions);
			} catch (error) {
				console.error(error.message);
				printUsage(currentCommand.optionList);
				process.exit(1);
			}
		}
	} else {
		printUsage([]);
		process.exit(1);
	}
}

run();
