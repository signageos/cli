import { organizationList } from './List/organizationListCommand';
import { organizationGet } from './Get/organizationGetCommand';
import { organizationSetDefault } from './SetDefault/organizationSetDefaultCommand';
import { createCommandDefinition } from '../Command/commandDefinition';

export const organization = createCommandDefinition({
	name: 'organization',
	description: 'Organization management',
	optionList: [],
	commands: [organizationList, organizationGet, organizationSetDefault],
	async run() {
		throw new Error('Unknown command');
	},
});
