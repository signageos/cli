import chalk from 'chalk';
import * as Debug from 'debug';
import * as prompts from 'prompts';
import { CommandLineOptions } from "command-line-args";
import { getResource, deserializeJSON } from '../helper';
import { IOrganization } from '../Organization/organizationFacade';
import { getGlobalApiUrl } from '../Command/commandProcessor';
const debug = Debug('@signageos/cli:Device:facade');

export interface IDevice {
	uid: string;
	name: string;
	// TODO missing props
}

export const DEVICE_UID_OPTION = { name: 'device-uid', type: String, description: 'Device UID' };

export async function getDeviceUid(
	organization: IOrganization,
	options: CommandLineOptions,
) {
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
	return deviceUid;
}

export async function getDevices(organization: IOrganization) {
	const DEVICE_RESOURCE = 'device';
	const options = {
		url: getGlobalApiUrl(),
		auth: {
			clientId: organization.oauthClientId,
			secret: organization.oauthClientSecret,
		},
		version: 'v1' as 'v1',
	};
	const responseOfGet = await getResource(options, DEVICE_RESOURCE);
	const bodyOfGet = JSON.parse(await responseOfGet.text(), deserializeJSON);
	debug('GET devices response', bodyOfGet);
	if (responseOfGet.status === 200) {
		return bodyOfGet;
	} else if (responseOfGet.status === 403) {
		throw new Error(`Authentication error. Try to login using ${chalk.green('sos login')}`);
	} else {
		throw new Error('Unknown error: ' + (bodyOfGet && bodyOfGet.message ? bodyOfGet.message : responseOfGet.status));
	}
}
