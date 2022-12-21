import * as fs from 'fs-extra';
import * as ini from 'ini';
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';
import chalk from 'chalk';
import { parameters } from '../parameters';
import { getGlobalProfile } from '../Command/globalArgs';

const RUN_CONTROL_FILENAME = '.sosrc';

export interface IConfig {
	apiUrl?: string;
	identification?: string;
	apiSecurityToken?: string;
	defaultOrganizationUid?: string;
	emulatorUid?: string;
}

type IConfigFile = IConfig & {
	[P in `profile ${string}`]?: IConfig;
};

export async function saveConfig(newConfig: IConfig) {
	newConfig = _.omitBy(newConfig, _.isNil);
	const runControlFilePath = getConfigFilePath();
	let configFile: IConfigFile = {};
	if (await fs.pathExists(runControlFilePath)) {
		const originalRCFileContent = await fs.readFile(runControlFilePath);
		configFile = ini.decode(originalRCFileContent.toString()) as IConfigFile;
	}

	const profile = getGlobalProfile();
	if (profile) {
		configFile[`profile ${profile}`] = newConfig;
	} else {
		configFile = _.omitBy(configFile, (_val, key) => !key.startsWith('profile '));
		Object.assign(configFile, newConfig);
	}

	const newRCFileContent = ini.encode(configFile);
	await fs.writeFile(runControlFilePath, newRCFileContent, {
		mode: 0o600,
	});
}

export async function updateConfig(partialConfig: Partial<IConfig>) {
	const currentConfig = await loadConfig();
	const newConfig = {
		...currentConfig,
		...partialConfig,
	};
	await saveConfig(newConfig);
}

export async function loadConfig(): Promise<IConfig> {
	const runControlFilePath = getConfigFilePath();
	let configFile: IConfigFile = {};
	if (await fs.pathExists(runControlFilePath)) {
		const runControlFileContent = await fs.readFile(runControlFilePath);
		configFile = ini.decode(runControlFileContent.toString()) as IConfigFile;
	}

	const profile = getGlobalProfile();
	const config = profile ? configFile[`profile ${profile}`] ?? {} : configFile;

	// Overriding from env vars if available
	if (parameters.accountAuth.tokenId) {
		config.identification = parameters.accountAuth.tokenId;
	}
	if (parameters.accountAuth.token) {
		config.apiSecurityToken = parameters.accountAuth.token;
	}
	if (parameters.defaultOrganizationUid) {
		config.defaultOrganizationUid = parameters.defaultOrganizationUid;
	}
	if (!config.apiUrl) {
		config.apiUrl = parameters.apiUrl;
	}

	// Temporary suggestion to login getting faster token
	if (config.identification && !config.identification.match(/[0-9a-f]{20,20}/)) {
		console.warn(
			chalk.bold.yellow(`Your authentication token is outdated. Please do the ${chalk.green('sos login')} again.`),
		);
		console.warn('After the log in, commands are becoming almost 10x faster.');
	}

	return config;
}

export function getConfigFilePath() {
	const homeDirectoryPath = os.homedir();
	const runControlFilePath = path.join(homeDirectoryPath, RUN_CONTROL_FILENAME);
	return runControlFilePath;
}
