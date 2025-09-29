import { organizationList } from './List/organizationListCommand';
import { organizationGet } from './Get/organizationGetCommand';
import { organizationSetDefault } from './SetDefault/organizationSetDefaultCommand';
import { createCommandDefinition } from '../Command/commandDefinition';

/**
 * Provides commands to manage signageOS organizations including listing available organizations,
 * retrieving organization details, and setting default organization for CLI operations.
 *
 * @group Management:201
 *
 * @subcommands
 * - `list` - List all organizations accessible to the current user
 * - `get` - Get details of a specific organization by UID
 * - `set-default` - Set a default organization for CLI operations
 *
 * @example
 * ```bash
 * # List all organizations
 * sos organization list
 *
 * # Get specific organization details
 * sos organization get --organization-uid abc123
 *
 * # Set default organization
 * sos organization set-default
 * ```
 *
 * @since 0.3.0
 */
export const organization = createCommandDefinition({
	name: 'organization',
	description: 'Organization management operations',
	optionList: [],
	commands: [organizationList, organizationGet, organizationSetDefault],
	async run() {
		throw new Error('Unknown command');
	},
});
