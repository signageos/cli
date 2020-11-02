import chalk from 'chalk';
import * as Debug from 'debug';
import * as prompts from 'prompts';
import { CommandLineOptions } from "command-line-args";
import { getResource, deserializeJSON } from '../helper';
import { IOrganization } from '../Organization/organizationFacade';
import { getGlobalApiUrl } from '../Command/commandProcessor';
import { DevicePowerAction } from '@signageos/sdk/dist/RestApi/Device/PowerAction/IPowerAction';

const debug = Debug('@signageos/cli:Device:facade');

export interface IDevice {
	uid: string;
	name: string;
	// TODO missing props
}

export interface ActionData {
	name: string;
	action: DevicePowerAction;
}

export const typeMap = new Map<string, ActionData>(
	[
		['reboot', {name: 'Reboot Device', action: DevicePowerAction.SystemReboot}],
		['displayOn', {name: 'Display ON', action: DevicePowerAction.DisplayPowerOn}],
		['display0ff', {name: 'Display OFF', action: DevicePowerAction.DisplayPowerOff}],
		['restart', {name: 'Restart Device', action: DevicePowerAction.AppRestart}],
		['disable', {name: 'Applet Disable', action: DevicePowerAction.AppletDisable}],
		['enable', {name: 'Applet Enable', action: DevicePowerAction.AppletEnable}],
		['reload', {name: 'Reboot Device', action: DevicePowerAction.AppletReload}],
		['refresh', {name: 'Applet Refresh', action: DevicePowerAction.AppletRefresh}],
	],
);

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

export async function getActionType(options: CommandLineOptions)  {
	let action: string | undefined = options.type;

	if (!action) {
		const response = await prompts({
			type: 'autocomplete',
			name: 'type',
			message: `Select device power action`,
			choices: Array.from(typeMap).map((item: [string, ActionData]) => ({
				title: item[1].name,
				value: item[0],
			})),
		});
		action = response.type;
	}
	if (!action) {
		throw new Error('Missing argument --type <string>');
	}
	if (!typeMap.get(action)) {
		throw new Error(`Wrong power action type argument --type. Action ${options.type} is not defined`);
	}

	return action;
}
