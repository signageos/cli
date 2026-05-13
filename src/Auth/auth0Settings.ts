import { Auth0Settings, readProfileField } from '@signageos/cli-common';
import { getGlobalProfile } from '../Command/globalArgs';

/**
 * Auth0 settings for the signageOS CLI tool (regular API).
 *
 * These connect to the regular signageOS API (not admin API).
 * Precedence: SOS_AUTH0_* env var (user-explicit override) > profile field in ~/.sosrc > SOS_DEFAULT_AUTH0_* env var (package default).
 */
export function getAuth0Settings(): Auth0Settings {
	const profile = getGlobalProfile();
	return {
		domain: process.env.SOS_AUTH0_DOMAIN ?? readProfileField('auth0Domain', profile) ?? process.env.SOS_DEFAULT_AUTH0_DOMAIN ?? '',
		clientId:
			process.env.SOS_AUTH0_CLIENT_ID ?? readProfileField('auth0ClientId', profile) ?? process.env.SOS_DEFAULT_AUTH0_CLIENT_ID ?? '',
		audience: process.env.SOS_AUTH0_AUDIENCE ?? readProfileField('auth0Audience', profile) ?? process.env.SOS_DEFAULT_AUTH0_AUDIENCE ?? '',
		scope: process.env.SOS_AUTH0_SCOPE ?? readProfileField('auth0Scope', profile) ?? process.env.SOS_DEFAULT_AUTH0_SCOPE ?? '',
	};
}

/**
 * Read the Box URL from the active profile.
 * Precedence: SOS_BOX_HOST env var (user-explicit override) > profile field in ~/.sosrc > SOS_DEFAULT_BOX_HOST env var (package default).
 */
export function getBoxUrl(): string {
	const profile = getGlobalProfile();
	return process.env.SOS_BOX_HOST ?? readProfileField('boxUrl', profile) ?? process.env.SOS_DEFAULT_BOX_HOST ?? '';
}
