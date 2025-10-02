import cliArgs from 'command-line-args';
import { API_URL_OPTION, PROFILE_OPTION } from '../generalCommand';

/**
 * Extract global API URL option from command line arguments.
 * Parses the global --api-url option that can be used to override the default
 * signageOS REST API endpoint for all CLI operations. This is useful for testing
 * against different environments or custom API deployments.
 *
 * @returns The API URL if specified, undefined otherwise
 *
 * @example
 * ```bash
 * # Use custom API URL
 * sos --api-url https://api.custom.signageos.io applet list
 * ```
 */
export function getGlobalApiUrl(): string | undefined {
	const options = cliArgs([API_URL_OPTION], { partial: true });
	return options[API_URL_OPTION.name];
}

/**
 * Extract global profile option from command line arguments.
 * Parses the global --profile option that specifies which authentication profile
 * to use for CLI operations. Profiles allow management of multiple signageOS
 * environments or accounts from the same machine.
 *
 * @returns The profile name if specified, falls back to default profile
 *
 * @example
 * ```bash
 * # Use specific profile
 * sos --profile production applet list
 *
 * # Use staging profile
 * sos --profile staging device connect
 * ```
 */
export function getGlobalProfile(): string {
	const options = cliArgs([PROFILE_OPTION], { partial: true });
	return options[PROFILE_OPTION.name];
}
