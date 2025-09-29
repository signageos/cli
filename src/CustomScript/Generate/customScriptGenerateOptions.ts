export const OPTION_LIST = [
	{ name: 'name', type: String, description: 'Custom script name' },
	{ name: 'description', type: String, description: 'Custom script description' },
	{ name: 'danger-level', type: String, description: 'Danger level (low|medium|high|critical)' },
	{ name: 'yes', type: Boolean, description: 'Skip confirmation prompts and use provided values' },
] as const;
