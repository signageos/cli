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
	return await loadConfigBase({ profile });
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
