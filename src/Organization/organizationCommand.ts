import ICommand from "../Command/ICommand";
import { organizationList } from './List/organizationListCommand';
import { organizationGet } from './Get/organizationGetCommand';

export const organization: ICommand = {
	name: 'organization',
	description: 'Organization management',
	optionList: [],
	commands: [
		organizationList,
		organizationGet,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
