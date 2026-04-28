import chalk from 'chalk';
import { log } from '@signageos/sdk/dist/Console/log';
import { getConfigFilePath } from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import { clearStoredTokens } from '@signageos/cli-common';
import { getGlobalProfile } from '../Command/globalArgs';
import { createCommandDefinition } from '../Command/commandDefinition';

/**
 * Logs the user out by clearing stored Auth0 tokens from `~/.sosrc`.
 * Non-auth fields (apiUrl, defaultOrganizationUid, emulatorUid) are preserved.
 *
 * @group Authentication:2
 *
 * @example
 * ```bash
 * # Logout from default profile
 * sos logout
 *
 * # Logout from a specific profile
 * sos --profile staging logout
 * ```
 *
 * @since 4.0.0
 */
export const logout = createCommandDefinition({
	name: 'logout',
	description: 'Log out from signageOS (clear stored tokens)',
	optionList: [],
	commands: [],
	async run() {
		const profile = getGlobalProfile();
		clearStoredTokens(profile);

		const configFilePath = getConfigFilePath();
		log('info', `Logged out. Auth tokens removed from ${chalk.blue(configFilePath)}.`);
	},
});
