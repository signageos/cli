import chalk from 'chalk';
import debug from 'debug';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { getDeviceUid, DEVICE_UID_OPTION } from '../../Device/deviceFacade';
import { createOrganizationRestApi } from '../../helper';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
const Debug = debug('@signageos/cli:Timing:list');

const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION, DEVICE_UID_OPTION] as const;

/**
 * Retrieves and displays all timing configurations that are currently assigned
 * to a specific device. Timing configurations define when and how content
 * (applets) should be displayed on devices, including scheduling and duration settings.
 *
 * @group Management:31
 *
 * @example
 * ```bash
 * # List timings for a specific device
 * sos timing list --device-uid device123
 *
 * # List timings with organization override
 * sos timing list --device-uid device123 --organization-uid org456
 * ```
 *
 * @throws {Error} When device cannot be found or accessed
 *
 * @throws {Error} When organization access is denied
 *
 * @throws {Error} When timing list retrieval fails
 *
 * @since 0.3.0
 */
export const timingList = createCommandDefinition({
	name: 'list',
	description: 'List timing configurations assigned to a device',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		Debug('Timing list');
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const timings = await restApi.timing.getList({
			deviceUid,
		});
		console.info(chalk.yellow(JSON.stringify(timings, undefined, 2)));
	},
});
