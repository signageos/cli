export const OPTION_LIST = [
	{
		name: 'name',
		type: String,
		description: 'Plugin name',
	},
	{
		name: 'description',
		type: String,
		description: 'Plugin description',
	},
	{
		name: 'yes',
		type: Boolean,
		description: 'Skip confirmation prompts and use provided values',
	},
] as const;
