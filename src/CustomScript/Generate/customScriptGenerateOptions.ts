export const OPTION_LIST = [
	{ name: 'name', type: String, description: 'Custom script name' },
	{ name: 'description', type: String, description: 'Custom script description' },
	{
		name: 'danger-level',
		type: String,
		description:
			'Danger level - Can be one of the following: low, medium, high, critical. It represents the danger level of the Custom Script. It should be set according to the potential impact of the Custom Script on the device.',
	},
	{ name: 'yes', type: Boolean, description: 'Skip confirmation prompts and use provided values' },
] as const;
