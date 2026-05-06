import { Auth0Settings, readProfileField } from '@signageos/cli-common';
import { getGlobalProfile } from '../Command/globalArgs';

/**
 * Auth0 settings for the signageOS CLI tool (regular API).
 *
 * These connect to the regular signageOS API (not admin API).
 * Precedence: environment variable > profile field in ~/.sosrc > .env default.
 */
export function getAuth0Settings(): Auth0Settings {
	const profile = getGlobalProfile();
	return {
		domain: readProfileField('auth0Domain', profile) ?? process.env.SOS_AUTH0_DOMAIN ?? '',
		clientId: readProfileField('auth0ClientId', profile) ?? process.env.SOS_AUTH0_CLIENT_ID ?? '',
		audience: readProfileField('auth0Audience', profile) ?? process.env.SOS_AUTH0_AUDIENCE ?? '',
		scope: readProfileField('auth0Scope', profile) ?? process.env.SOS_AUTH0_SCOPE ?? '',
	};
}

/**
 * Read the Box URL from the active profile.
 * Precedence: profile field in ~/.sosrc > environment variable (.env default).
 */
export function getBoxUrl(): string {
	const profile = getGlobalProfile();
	return readProfileField('boxUrl', profile) ?? process.env.SOS_BOX_HOST ?? '';
}
