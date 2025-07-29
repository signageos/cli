import chalk from 'chalk';
import debug from 'debug';
import { selectOrganizationUid, getOrganization, ORGANIZATION_UID_OPTION } from '../organizationFacade';
import { updateConfig } from '../../RunControl/runControlHelper';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';
const Debug = debug('@signageos/cli:Organization:get');

const OPTION_LIST = [ORGANIZATION_UID_OPTION] as const;

/**
 * Sets a default organization that will be used automatically in subsequent CLI commands
 * that require an organization context. This eliminates the need to specify the organization
 * UID for each command. The default organization is stored in the ~/.sosrc configuration file.
 *
 * @group Management:3
 *
 * @example
 * ```bash
 * # Interactive selection of default organization
 * sos organization set-default
 *
 * # Set specific organization as default
 * sos organization set-default --organization-uid abc123
 * ```
 *
 * @remarks
 * The default organization can be overridden using the SOS_ORGANIZATION_UID environment variable
 * or by using the --organization-uid flag in individual commands.
 *
 * @throws {Error} When organization UID is invalid or inaccessible
 *
 * @since 1.0.0
 */
export const organizationSetDefault = createCommandDefinition({
	name: 'set-default',
	description: 'Set a default organization for CLI operations',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		Debug('Organization set default');
		const defaultOrganizationUid = await selectOrganizationUid(options);
		const organization = await getOrganization(defaultOrganizationUid);
		await updateConfig({
			defaultOrganizationUid,
		});
		log('info', `Organization ${chalk.green(`${organization.title} (${organization.name}, ${organization.uid})`)} has been set as default`);
	},
});
