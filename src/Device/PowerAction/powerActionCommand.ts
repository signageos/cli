import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { DEVICE_UID_OPTION, getDeviceUid, POWER_ACTION_TYPE_OPTION, typeMap, getActionType } from '../deviceFacade';
import { createOrganizationRestApi } from '../../helper';
import chalk from 'chalk';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';

const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION, DEVICE_UID_OPTION, POWER_ACTION_TYPE_OPTION] as const;

export const powerAction = createCommandDefinition({
	name: 'power-action',
	description: 'Perform power action on device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const actionType = await getActionType(options);
		await restApi.device.powerAction
			.set(deviceUid, {
				devicePowerAction: typeMap.get(actionType)!.action,
			})
			.finally(() => {
				log('info', chalk.green(`Action ${typeMap.get(actionType)!.name} was successful on device ${deviceUid}`));
			});
	},
});
