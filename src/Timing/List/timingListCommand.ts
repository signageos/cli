import chalk from 'chalk';
import * as Debug from 'debug';
import { getOrganization, getOrganizationUidOrDefaultOrSelect, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import { getDeviceUid, DEVICE_UID_OPTION } from '../../Device/deviceFacade';
import { createOrganizationRestApi } from '../../helper';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { GENERAL_OPTION_LIST } from '../../generalCommand';
const debug = Debug('@signageos/cli:Timing:list');

const OPTION_LIST = [
	...GENERAL_OPTION_LIST,
	ORGANIZATION_UID_OPTION,
	DEVICE_UID_OPTION,
] as const;

export const timingList = createCommandDefinition({
	name: 'list',
	description: 'List timings assigned to device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		debug('Timing create');
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const timings = await restApi.timing.getList({
			deviceUid,
		});
		console.log(chalk.yellow(JSON.stringify(timings, undefined, 2)));
	},
});
