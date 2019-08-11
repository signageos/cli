import chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getOrganizationUid, getOrganization, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import { getDeviceUid, DEVICE_UID_OPTION } from '../../Device/deviceFacade';
import { createOrganizationRestApi } from '../../helper';
const debug = Debug('@signageos/cli:Timing:list');

export const timingList = {
	name: 'list',
	optionList: [
		ORGANIZATION_UID_OPTION,
		DEVICE_UID_OPTION,
	],
	commands: [],
	async run(options: CommandLineOptions) {
		debug('Timing create');
		const organizationUid = await getOrganizationUid(options);
		const organization = await getOrganization(organizationUid);
		const deviceUid = await getDeviceUid(organization, options);
		const restApi = createOrganizationRestApi(organization);
		const timings = await restApi.timing.getList({
			deviceUid,
		});
		console.log(chalk.yellow(JSON.stringify(timings, undefined, 2)));
	},
};
