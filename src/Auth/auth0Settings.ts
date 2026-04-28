import { Auth0Settings } from '@signageos/cli-common';

/**
 * Auth0 settings for the signageOS CLI tool (regular API).
 *
 * These connect to the regular signageOS API (not admin API).
 * Override with environment variables for testing or custom Auth0 tenants.
 */
export function getAuth0Settings(): Auth0Settings {
	return {
		domain: process.env.SOS_AUTH0_DOMAIN ?? 'sos-production.us.auth0.com',
		clientId: process.env.SOS_AUTH0_CLIENT_ID ?? '8AU8D3zJ4mK8gszZP3gZO0nv9DusSNjV',
		audience: process.env.SOS_AUTH0_AUDIENCE ?? 'https://sos-production.us.auth0.com/api/v2/',
		scope: process.env.SOS_AUTH0_SCOPE ?? 'openid profile email offline_access',
	};
}
