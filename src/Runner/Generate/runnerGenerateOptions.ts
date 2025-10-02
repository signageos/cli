export const OPTION_LIST = [
	{
		name: 'name',
		type: String,
		description: 'Runner name',
	},
	{
		name: 'description',
		type: String,
		description: 'Runner description',
	},
	{
		name: 'yes',
		type: Boolean,
		description: 'Skip confirmation prompts and use provided values',
	},
] as const;
