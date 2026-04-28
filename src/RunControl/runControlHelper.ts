import {
	IConfig,
	loadConfig as loadConfigBase,
	saveConfig as saveConfigBase,
	updateConfig as updateConfigBase,
} from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import { loadStoredTokens, isTokenExpired, refreshAccessToken, saveStoredTokens } from '@signageos/cli-common';
import { getGlobalProfile } from '../Command/globalArgs';
import { getAuth0Settings } from '../Auth/auth0Settings';

/**
 * Extended config interface that includes Auth0 JWT token alongside legacy fields.
 * When `accessToken` is present, it takes precedence over `identification`/`apiSecurityToken`.
 */
export interface IExtendedConfig extends IConfig {
	accessToken?: string;
}

/** The same as loadConfig in SDK, but respect CLI --profile argument and Auth0 tokens */
export async function loadConfig(): Promise<IExtendedConfig> {
	const profile = getGlobalProfile();
	const config = await loadConfigBase({ profile });

	// Override with environment variables if they exist.
	// When --profile is explicitly given, skip the SOS_API_URL override so the
	// profile's own apiUrl is used instead of the ambient environment variable.
	const envOverride: Partial<IExtendedConfig> = {};
	if (process.env.SOS_API_IDENTIFICATION) {
		envOverride.identification = process.env.SOS_API_IDENTIFICATION;
	}
	if (process.env.SOS_API_SECURITY_TOKEN) {
		envOverride.apiSecurityToken = process.env.SOS_API_SECURITY_TOKEN;
	}
	if (process.env.SOS_ORGANIZATION_UID) {
		envOverride.defaultOrganizationUid = process.env.SOS_ORGANIZATION_UID;
	}
	if (process.env.SOS_API_URL && !profile) {
		envOverride.apiUrl = process.env.SOS_API_URL;
	}

	const finalConfig: IExtendedConfig = { ...config, ...envOverride };

	// Check for SOS_ACCESS_TOKEN env var (CI-friendly JWT override)
	const envToken = process.env.SOS_ACCESS_TOKEN;
	if (envToken) {
		finalConfig.accessToken = envToken;
		return finalConfig;
	}

	// Try to load Auth0 tokens from ~/.sosrc
	const tokens = loadStoredTokens(profile);
	if (tokens) {
		if (isTokenExpired(tokens)) {
			if (tokens.refreshToken) {
				try {
					const auth0 = getAuth0Settings();
					const refreshed = await refreshAccessToken(auth0, tokens.refreshToken);
					saveStoredTokens(refreshed, profile);
					finalConfig.accessToken = refreshed.accessToken;
				} catch {
					// Token refresh failed — fall through to legacy auth or require re-login
				}
			}
		} else {
			finalConfig.accessToken = tokens.accessToken;
		}
	}

	return finalConfig;
}

/** The same as saveConfig in SDK, but respect CLI --profile argument */
export async function saveConfig(newConfig: IConfig) {
	const profile = getGlobalProfile();
	return await saveConfigBase(newConfig, { profile });
}

/** The same as updateConfig in SDK, but respect CLI --profile argument */
export async function updateConfig(partialConfig: Partial<IConfig>) {
	const profile = getGlobalProfile();
	return await updateConfigBase(partialConfig, { profile });
}
