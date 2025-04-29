import chalk from 'chalk';
import debug from 'debug';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../organizationFacade';
const Debug = debug('@signageos/cli:Organization:get');

const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION] as const;

export const organizationGet = createCommandDefinition({
	name: 'get',
	description: 'Get one organization by UID',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		Debug('Organization get');
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		console.log(chalk.yellow(JSON.stringify(organization, undefined, 2)));
	},
});
