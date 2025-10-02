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

/**
 * Executes various power and control actions on remote signageOS devices, including
 * applet reloads, display power management, system reboots, and applet state changes.
 * This command provides remote device management capabilities for troubleshooting
 * and maintenance operations.
 *
 * @group Management:12
 *
 * @example
 * ```bash
 * # Reload applet on device
 * sos device power-action reload --device-uid device123
 *
 * # Turn display on
 * sos device power-action displayOn --device-uid device123
 *
 * # Turn display off
 * sos device power-action displayOff --device-uid device123
 *
 * # Restart application
 * sos device power-action restart --device-uid device123
 *
 * # Disable applet
 * sos device power-action disable --device-uid device123
 *
 * # Enable applet
 * sos device power-action enable --device-uid device123
 *
 * # Reboot device
 * sos device power-action reboot --device-uid device123
 *
 * # Refresh content
 * sos device power-action refresh --device-uid device123
 * ```
 *
 * # Reboot system
 * sos device power-action reboot --device-uid device123
 *
 * # Refresh applet
 * sos device power-action refresh --device-uid device123
 * ```
 *
 * @throws {Error} When device cannot be found or accessed
 *
 * @throws {Error} When power action is not supported by device
 *
 * @throws {Error} When organization access is denied
 *
 * @throws {Error} When power action execution fails
 *
 * @since 0.9.0
 */
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
