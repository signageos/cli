import debug from 'debug';
import prompts from 'prompts';
import { deserializeJSON, getApiUrl, postResource } from '../helper';
import { IOrganization } from '../Organization/organizationFacade';
import { DevicePowerAction } from '@signageos/sdk/dist/RestApi/Device/PowerAction/IPowerAction';
import RestApi from '@signageos/sdk/dist/RestApi/RestApi';
import { CommandLineOptions } from '../Command/commandDefinition';
import IDeviceReadOnly from '@signageos/sdk/dist/RestApi/Device/IDevice';
import { ApiVersions } from '@signageos/sdk/dist/RestApi/apiVersions';
import { loadConfig } from '../RunControl/runControlHelper';

const Debug = debug('@signageos/cli:Device:facade');

export interface ActionData {
	name: string;
	action: DevicePowerAction;
}

export const typeMap = new Map<string, ActionData>([
	['reboot', { name: 'Reboot Device', action: DevicePowerAction.SystemReboot }],
	['displayOn', { name: 'Display ON', action: DevicePowerAction.DisplayPowerOn }],
	['display0ff', { name: 'Display OFF', action: DevicePowerAction.DisplayPowerOff }],
	['restart', { name: 'Restart Device', action: DevicePowerAction.AppRestart }],
	['disable', { name: 'Applet Disable', action: DevicePowerAction.AppletDisable }],
	['enable', { name: 'Applet Enable', action: DevicePowerAction.AppletEnable }],
	['reload', { name: 'Applet Reload', action: DevicePowerAction.AppletReload }],
	['refresh', { name: 'Applet Refresh', action: DevicePowerAction.AppletRefresh }],
]);

export const DEVICE_UID_OPTION = { name: 'device-uid', type: String, description: 'Device UID' } as const;
export const POWER_ACTION_TYPE_OPTION = { name: 'type', type: String, description: `Type of device power action` } as const;

export async function getDeviceUid(restApi: RestApi, options: CommandLineOptions<[typeof DEVICE_UID_OPTION]>) {
	let deviceUid: string | undefined = options['device-uid'];
	if (!deviceUid) {
		const devices = await restApi.device.list();
		const response = await prompts({
			type: 'autocomplete',
			name: 'deviceUid',
			message: `Select device to use`,
			choices: devices.map((dev: IDeviceReadOnly) => ({
				title: `${dev.name ?? `Unnamed device, created ${dev.createdAt.toString()}`} (${dev.uid})`,
				value: dev.uid,
			})),
		});
		Debug('Device selected', response.deviceUid);
		deviceUid = response.deviceUid;
	}
	if (!deviceUid) {
		throw new Error('Missing argument --device-uid <string>');
	}
	return deviceUid;
}

export async function getActionType(options: CommandLineOptions<[typeof POWER_ACTION_TYPE_OPTION]>) {
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

export async function disconnectDevice(organization: IOrganization, deviceUid: string) {
	const config = await loadConfig();
	const DEVICE_RESOURCE = `/device/${deviceUid}/disconnect`;
	const options = {
		url: getApiUrl(config),
		auth: {
			clientId: organization.oauthClientId,
			secret: organization.oauthClientSecret,
		},
		version: ApiVersions.V1,
	};
	const responseOfPost = await postResource(options, DEVICE_RESOURCE, null, { deviceUid: `${deviceUid}` });
	return JSON.parse(await responseOfPost.text(), deserializeJSON);
}
