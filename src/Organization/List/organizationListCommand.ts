import chalk from 'chalk';
import debug from 'debug';
import { createCommandDefinition } from '../../Command/commandDefinition';
import { getOrganizations } from '../organizationFacade';
const Debug = debug('@signageos/cli:Organization:list');

export const organizationList = createCommandDefinition({
	name: 'list',
	description: 'List organizations for logged account',
	optionList: [],
	commands: [],
	async run() {
		Debug('Organization list');
		const organizations = await getOrganizations();
		console.log(chalk.yellow(JSON.stringify(organizations, undefined, 2)));
	},
});
