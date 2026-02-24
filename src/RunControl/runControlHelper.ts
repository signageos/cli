import {
	IConfig,
	loadConfig as loadConfigBase,
	saveConfig as saveConfigBase,
	updateConfig as updateConfigBase,
} from '@signageos/sdk/dist/SosHelper/sosControlHelper';
import { getGlobalProfile } from '../Command/globalArgs';

/** The same as loadConfig in SDK, but respect CLI --profile argument */
export async function loadConfig() {
	const profile = getGlobalProfile();
	const config = await loadConfigBase({ profile });

	// Override with environment variables if they exist.
	// When --profile is explicitly given, skip the SOS_API_URL override so the
	// profile's own apiUrl is used instead of the ambient environment variable.
	const envOverride: Partial<IConfig> = {};
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

	const finalConfig = { ...config, ...envOverride };

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
