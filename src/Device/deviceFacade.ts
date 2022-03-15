import * as Debug from 'debug';
import * as prompts from 'prompts';
import { deserializeJSON, postResource } from '../helper';
import { IOrganization } from '../Organization/organizationFacade';
import { getGlobalApiUrl } from '../Command/commandProcessor';
import { DevicePowerAction } from '@signageos/sdk/dist/RestApi/Device/PowerAction/IPowerAction';
import RestApi from "@signageos/sdk/dist/RestApi/RestApi";
import { IApplet } from "../Applet/appletFacade";
import { getMachineIp } from "./Connect/connectHelper";
import { CommandLineOptions } from '../Command/commandDefinition';

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
		['reload', {name: 'Applet Reload', action: DevicePowerAction.AppletReload}],
		['refresh', {name: 'Applet Refresh', action: DevicePowerAction.AppletRefresh}],
	],
);

export const DEVICE_UID_OPTION = { name: 'device-uid', type: String, description: 'Device UID' } as const;
export const POWER_ACTION_TYPE_OPTION = { name: 'type', type: String, description: `Type of device power action` } as const;

export async function getDeviceUid(
	restApi: RestApi,
	options: CommandLineOptions<[typeof DEVICE_UID_OPTION]>,
) {
	let deviceUid: string | undefined = options['device-uid'];
	if (!deviceUid) {
		const devices = await restApi.device.list();
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

export async function getActionType(options: CommandLineOptions<[typeof POWER_ACTION_TYPE_OPTION]>)  {
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

export async function connectDevice(organization: IOrganization, deviceUid: String, applet: Partial<IApplet>, serverPort: string) {
	const DEVICE_RESOURCE = `/device/${deviceUid}/connect`;
	const options = {
		url: getGlobalApiUrl(),
		auth: {
			clientId: organization.oauthClientId,
			secret: organization.oauthClientSecret,
		},
		version: 'v1' as 'v1',
	};
	const computerIp = await getMachineIp();
	const protocol: string =  "http://";
	const body = {
			deviceUid: deviceUid,
			appletUid:  applet.uid,
			remoteIp: protocol.concat(computerIp + `:${serverPort}`),
			appletVersion: applet.version,
	};
	const responseOfPost = await postResource(options, DEVICE_RESOURCE, null , body);
	return JSON.parse(await responseOfPost.text(), deserializeJSON);
}

export async function disconnectDevice(organization: IOrganization, deviceUid: String) {
	const DEVICE_RESOURCE = `/device/${deviceUid}/disconnect`;
	const options = {
		url: getGlobalApiUrl(),
		auth: {
			clientId: organization.oauthClientId,
			secret: organization.oauthClientSecret,
		},
		version: 'v1' as 'v1',
	};
	const responseOfPost = await postResource(options, DEVICE_RESOURCE, null , {"deviceUid": `${deviceUid}`});
	return JSON.parse(await responseOfPost.text(), deserializeJSON);
}
