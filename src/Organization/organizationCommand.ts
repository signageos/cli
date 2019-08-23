import ICommand from "../Command/ICommand";
import { organizationList } from './List/organizationListCommand';
import { organizationGet } from './Get/organizationGetCommand';
import { organizationSetDefault } from "./SetDefault/organizationSetDefaultCommand";

export const organization: ICommand = {
	name: 'organization',
	description: 'Organization management',
	optionList: [],
	commands: [
		organizationList,
		organizationGet,
		organizationSetDefault,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
