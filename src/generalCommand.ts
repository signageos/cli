export const VERSION_OPTION = {
	name: 'version',
	alias: 'v',
	type: Boolean,
	description: 'Display installed version of the CLI.',
} as const;
export const API_URL_OPTION = {
	name: 'api-url',
	alias: 'u',
	type: String,
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
export const PROFILE_OPTION = {
	name: 'profile',
	type: String,
	description: 'signageOS Profile to be used for authentication and other values from ~/.sosrc config file.',
} as const;

export const GENERAL_OPTION_LIST = [COMMAND_OPTION, HELP_OPTION, API_URL_OPTION, VERSION_OPTION, PROFILE_OPTION] as const;
