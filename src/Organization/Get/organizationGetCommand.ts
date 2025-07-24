import chalk from 'chalk';
import debug from 'debug';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../organizationFacade';
const Debug = debug('@signageos/cli:Organization:get');

const OPTION_LIST = [NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION] as const;

/**
 * Retrieves and displays detailed information about a specific organization
 * by its UID. If no organization UID is provided, uses the default organization
 * or prompts for selection from available organizations.
 *
 * @group Management:2
 *
 * @example
 * ```bash
 * # Get default organization details
 * sos organization get
 *
 * # Get specific organization by UID
 * sos organization get --organization-uid abc123def456
 *
 * # Force organization selection (skip default)
 * sos organization get --no-default-organization
 * ```
 *
 * @throws {Error} When organization UID cannot be found or accessed
 * @throws {Error} When authentication is not valid or has expired
 * @throws {Error} When no organizations are available for selection
 *
 * @see {@link ../list/ List organizations for selection}
 *
 * @see {@link ../ Organization management commands}
 *
 * @since 0.3.0
 */
export const organizationGet = createCommandDefinition({
	name: 'get',
	description: 'Get detailed information about a specific organization',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		Debug('Organization get');
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		console.info(chalk.yellow(JSON.stringify(organization, undefined, 2)));
	},
});
