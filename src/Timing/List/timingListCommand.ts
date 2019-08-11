import chalk from 'chalk';
import * as prompts from 'prompts';
import * as Debug from 'debug';
import { CommandLineOptions } from "command-line-args";
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import * as parameters from '../../../config/parameters';
import { getOrganization } from '../../Organization/Get/organizationGetCommand';
import { IOrganization } from '../../Organization/organizationCommand';
import { getOrganizations } from '../../Organization/List/organizationListCommand';
import { IDevice } from '../../Device/deviceCommand';
import { getDevices } from '../../Device/List/deviceListCommand';
const debug = Debug('@signageos/cli:Timing:list');

export const timingList = {
	name: 'list',
	optionList: [
		{ name: 'organization-uid', type: String, description: 'Organization UID' },
		{ name: 'device-uid', type: String, description: 'Device UID' },
	],
	commands: [],
	async run(options: CommandLineOptions) {
		let organizationUid: string | undefined = options['organization-uid'];
		if (!organizationUid) {
			const organizations = await getOrganizations();
			const response = await prompts({
				type: 'autocomplete',
				name: 'organizationUid',
				message: `Select organization to use`,
				choices: organizations.map((org: IOrganization) => ({
					title: `${org.title} (${org.name}, ${org.uid})`,
					value: org.uid,
				})),
			});
			debug('Organization selected', response.organizationUid);
			organizationUid = response.organizationUid;
		}
		if (!organizationUid) {
			throw new Error('Missing argument --organization-uid <string>');
		}

		const organization = await getOrganization(organizationUid);

		let deviceUid: string | undefined = options['device-uid'];
		if (!deviceUid) {
			const devices = await getDevices(organization);
			const response = await prompts({
				type: 'autocomplete',
				name: 'deviceUid',
				message: `Select device to use`,
				choices: devices.map((dev: IDevice) => ({
					title: `${dev.name} (${dev.uid})`,
					value: dev.uid,
				})),
			});
			debug('Device selected', response.deviceUid);
			deviceUid = response.deviceUid;
		}
		if (!deviceUid) {
			throw new Error('Missing argument --device-uid <string>');
		}

		const restApi = new RestApi({
			url: parameters.apiUrl,
			auth: {
				clientId: organization.oauthClientId,
				secret: organization.oauthClientSecret,
			},
			version: 'v1' as 'v1',
		});

		const timings = await restApi.timing.getList({
			deviceUid,
		});
		console.log(chalk.yellow(JSON.stringify(timings, undefined, 2)));
	},
};
