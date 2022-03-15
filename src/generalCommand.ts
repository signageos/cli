import * as parameters from '../config/parameters';
import { VERSION_OPTION } from './Cli/packageVersion';
import { NO_DEFAULT_ORGANIZATION_OPTION } from './Organization/organizationFacade';

export const API_URL_OPTION = {
	name: 'api-url',
	alias: 'u',
	type: String,
	defaultValue: parameters.apiUrl,
	description: 'API URL to be used for REST requests',
} as const;
export const COMMAND_OPTION = {
	name: 'command',
	alias: 'c',
	type: String,
	multiple: true,
	defaultOption: true,
	defaultValue: [],
	description: `(default) Command name`,
} as const;
export const HELP_OPTION = {
	name: 'help',
	alias: 'h',
	type: Boolean,
	description: 'Display this usage guide.',
} as const;

export const GENERAL_OPTION_LIST = [
	COMMAND_OPTION,
	HELP_OPTION,
	API_URL_OPTION,
	VERSION_OPTION,
	NO_DEFAULT_ORGANIZATION_OPTION,
] as const;
