import chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { GENERAL_OPTION_LIST } from '../../generalCommand';
import { getOrganization, getOrganizationUidOrDefaultOrSelect, ORGANIZATION_UID_OPTION } from '../organizationFacade';
const debug = Debug('@signageos/cli:Organization:get');

const OPTION_LIST = [
	...GENERAL_OPTION_LIST,
	ORGANIZATION_UID_OPTION,
] as const;

export const organizationGet = createCommandDefinition({
	name: 'get',
	description: 'Get one organization by UID',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		debug('Organization get');
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		console.log(chalk.yellow(JSON.stringify(organization, undefined, 2)));
	},
});
