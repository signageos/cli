import * as chalk from 'chalk';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import { getOrganizationUid, getOrganization, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import { getDeviceUid, DEVICE_UID_OPTION } from '../../Device/deviceFacade';
import { createOrganizationRestApi } from '../../helper';
import ICommand from '../../Command/ICommand';
const debug = Debug('@signageos/cli:Timing:list');

export const timingList: ICommand = {
	name: 'list',
	description: 'List timings assigned to device',
	optionList: [
		ORGANIZATION_UID_OPTION,
		DEVICE_UID_OPTION,
	],
	commands: [],
	async run(options: CommandLineOptions) {
		debug('Timing create');
		const organizationUid = await getOrganizationUid(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const timings = await restApi.timing.getList({
			deviceUid,
		});
		console.log(chalk.yellow(JSON.stringify(timings, undefined, 2)));
	},
};
