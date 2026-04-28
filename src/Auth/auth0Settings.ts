import { Auth0Settings } from '@signageos/cli-common';

/**
 * Auth0 settings for the signageOS CLI tool (regular API).
 *
 * These connect to the regular signageOS API (not admin API).
 * Override with environment variables for testing or custom Auth0 tenants.
 */
export function getAuth0Settings(): Auth0Settings {
	return {
		domain: process.env.SOS_AUTH0_DOMAIN ?? 'signageos.eu.auth0.com',
		clientId: process.env.SOS_AUTH0_CLIENT_ID ?? 'PLACEHOLDER_CLI_CLIENT_ID',
		audience: process.env.SOS_AUTH0_AUDIENCE ?? 'https://api.signageos.io',
		scope: process.env.SOS_AUTH0_SCOPE ?? 'openid profile email offline_access',
	};
}
