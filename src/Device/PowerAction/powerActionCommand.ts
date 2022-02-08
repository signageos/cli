import ICommand from "../../Command/ICommand";
import { getOrganization, getOrganizationUid, ORGANIZATION_UID_OPTION } from "../../Organization/organizationFacade";
import { DEVICE_UID_OPTION, getDeviceUid, typeMap } from "../deviceFacade";
import { CommandLineOptions } from "command-line-args";
import { createOrganizationRestApi } from "../../helper";
import * as chalk from 'chalk';
import { getActionType } from "../deviceFacade";

export const powerAction: ICommand = {
	name: 'power-action',
	description: 'Perform power action on device',
	optionList: [
		ORGANIZATION_UID_OPTION,
		DEVICE_UID_OPTION,
		{ name: 'type', type: String, description: `Type of device power action`},
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const organizationUid = await getOrganizationUid(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const actionType = await getActionType(options);
		await restApi.device.powerAction.set(deviceUid, {
			devicePowerAction:  typeMap.get(actionType)!.action,
		}).finally(() => {
			console.log(chalk.green(`Action ${typeMap.get(actionType)!.name} was successful on device ${deviceUid}`));
		});
	},
};
