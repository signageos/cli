import chalk from 'chalk';
import debug from 'debug';
import { createCommandDefinition } from '../../Command/commandDefinition';
import { getOrganizations } from '../organizationFacade';
const Debug = debug('@signageos/cli:Organization:list');

/**
 * Retrieves and displays all organizations that the currently authenticated
 * account has access to. This command helps users understand which organizations
 * they can work with and select appropriate targets for other CLI operations.
 *
 * @group Management:1
 *
 * @example
 * ```bash
 * # List all accessible organizations
 * sos organization list
 * ```
 *
 * @throws {Error} When authentication is not valid or has expired
 * @throws {Error} When organization access cannot be determined
 *
 * @see {@link ../get/ Get detailed organization information}
 *
 * @since 0.3.0
 */
export const organizationList = createCommandDefinition({
	name: 'list',
	description: 'List organizations for logged account',
	optionList: [],
	commands: [],
	async run() {
		Debug('Organization list');
		const organizations = await getOrganizations();
		console.info(chalk.yellow(JSON.stringify(organizations, undefined, 2)));
	},
});
