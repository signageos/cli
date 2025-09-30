import { log } from '@signageos/sdk/dist/Console/log';
import chalk from 'chalk';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersionFromApi } from '../../Applet/appletFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { createOrganizationRestApi } from '../../helper';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { DEVICE_UID_OPTION, getDeviceUid } from '../deviceFacade';

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	APPLET_UID_OPTION,
	DEVICE_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: 'Skip selection prompts (requires explicit device-uid and applet-uid for safety)',
	},
] as const;

/**
 * Deploys an applet to a specific device by creating a timing configuration
 * that activates the specified applet version on the target device. This command
 * establishes the applet-to-device relationship for production deployment.
 *
 * @group Management:13
 *
 * @example
 * ```bash
 * # Deploy applet to device (interactive, allows selection if multiple versions exist)
 * sos device set-content --device-uid device123 --applet-uid my-applet
 *
 * # Skip selection prompts (requires explicit UIDs, fails if multiple versions)
 * sos device set-content --device-uid device123 --applet-uid my-applet --yes
 *
 * # Deploy with organization override
 * sos device set-content --device-uid device123 --applet-uid my-applet --organization-uid org456
 * ```
 *
 * @throws {Error} When device-uid or applet-uid arguments are missing
 * @throws {Error} When multiple applets/versions exist and --yes is used
 * @throws {Error} When device or applet cannot be found or accessed
 * @throws {Error} When timing configuration creation fails
 * @throws {Error} When organization access is denied
 * @throws {Error} When user cancels interactive prompts (without `--yes`)
 *
 * @since 0.9.0
 */
export const setContent = createCommandDefinition({
	name: 'set-content',
	description: 'Deploy applet to device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const skipConfirmation = !!options.yes;
		const appletUid = await getAppletUid(restApi, options, skipConfirmation);
		const appletVersion = await getAppletVersionFromApi(restApi, appletUid, skipConfirmation);
		const deviceUid = await getDeviceUid(restApi, options, skipConfirmation);
		await restApi.timing.create({
			deviceUid: deviceUid,
			appletUid: appletUid,
			appletVersion: appletVersion,
			startsAt: new Date(),
			endsAt: new Date(),
			position: 1,
			configuration: {
				identification: 'Deploy from CLI ',
			},
			finishEvent: {
				type: 'DURATION',
				data: '1000',
			},
		});
		log('info', chalk.green(`Applet ${appletUid} was set on device ${deviceUid}`));
	},
});
