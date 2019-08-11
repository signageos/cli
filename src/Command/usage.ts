import * as _ from 'lodash';
import * as cliUsage from 'command-line-usage';
import { OptionDefinition as ArgsOptionDefinition } from "command-line-args";
import { OptionDefinition as UsageOptionDefinition } from "command-line-usage";
import ICommand from './ICommand';
import { applet } from '../Applet/appletCommand';
import { login } from '../Auth/loginCommand';
import { organization } from '../Organization/organizationCommand';
import * as parameters from '../../config/parameters';

export type OptionDefinition = ArgsOptionDefinition & UsageOptionDefinition;

export const generalCommands: ICommand[] = [
	applet,
	login,
	organization,
];

export function getOptionListRecursive(
	commands: ICommand[] = generalCommands,
	initialOptionList: OptionDefinition[] = generalOptionList,
): OptionDefinition[] {
	return deduplicateOptions([
		...initialOptionList,
		..._.flatMap(
			commands,
			(command: ICommand) => [...command.optionList, ...getOptionListRecursive(command.commands, [])],
		),
	]);
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
		optionList: deduplicateOptions([...generalOptionList, ...optionList]),
	});
	console.log(usage);
}

function deduplicateOptions(optionList: OptionDefinition[]) {
	return _.uniqBy(
		optionList,
		(optionDef: OptionDefinition) => optionDef.name,
	);
}
