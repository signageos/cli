import chalk from 'chalk';
import debug from 'debug';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { getDeviceUid, DEVICE_UID_OPTION } from '../../Device/deviceFacade';
import { createOrganizationRestApi } from '../../helper';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
const Debug = debug('@signageos/cli:Timing:list');

const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION, DEVICE_UID_OPTION] as const;

export const timingList = createCommandDefinition({
	name: 'list',
	description: 'List timings assigned to device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		Debug('Timing list');
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const timings = await restApi.timing.getList({
			deviceUid,
		});
		console.log(chalk.yellow(JSON.stringify(timings, undefined, 2)));
	},
});
