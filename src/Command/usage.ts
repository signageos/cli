import * as _ from 'lodash';
import * as cliUsage from 'command-line-usage';
import { OptionDefinition as ArgsOptionDefinition } from "command-line-args";
import { OptionDefinition as UsageOptionDefinition } from "command-line-usage";
import ICommand from './ICommand';
import { applet } from '../Applet/appletCommand';

export type OptionDefinition = ArgsOptionDefinition & UsageOptionDefinition;

export const generalCommands: ICommand[] = [
	applet,
];

type IParameters = {
	apiUrl?: string;
};

const parameters: IParameters = require('../../config/parameters');

export function getOptionListRecursive(
	commands: ICommand[] = generalCommands,
	initialOptionList: OptionDefinition[] = generalOptionList,
): OptionDefinition[] {
	return [
		...initialOptionList,
		..._.flatMap(
			commands,
			(command: ICommand) => [...command.optionList, ...getOptionListRecursive(command.commands, [])],
		),
	];
}

export const generalOptionList: OptionDefinition[] = [
	{
		name: 'command',
		alias: 'c',
		type: String,
		multiple: true,
		defaultOption: true,
		defaultValue: [],
		description: `Command name. One of following: ${generalCommands.map((command: ICommand) => command.name)}`,
	},
	{ name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.' },
	{ name: 'api-url', alias: 'u', type: String, defaultValue: parameters.apiUrl, description: 'API URL to be used for REST requests' },
];

export function printUsage(
	optionList: OptionDefinition[],
) {
	const usage = cliUsage({
		optionList: [...generalOptionList, ...optionList],
	});
	console.log(usage);
}
