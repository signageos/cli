import * as fs from 'fs-extra';
import * as ini from 'ini';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import * as parameters from '../../config/parameters';

const RUN_CONTROL_FILENAME = '.sosrc';

export interface IConfig {
	identification?: string;
	apiSecurityToken?: string;
	defaultOrganizationUid?: string;
	emulatorUid?: string;
}

export async function saveConfig(config: IConfig) {
	const runControlFilePath = getConfigFilePath();
	const runControlFileContent = ini.encode(config);
	await fs.writeFile(runControlFilePath, runControlFileContent, {
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
	let config: IConfig = {};
	if (await fs.pathExists(runControlFilePath)) {
		const runControlFileContent = await fs.readFile(runControlFilePath);
		config = ini.decode(runControlFileContent.toString()) as IConfig;
	}

	// Overriding from env vars if available
	if (parameters.accountAuth.tokenId) {
		config.identification = parameters.accountAuth.tokenId;
	}
	if (parameters.accountAuth.token) {
		config.apiSecurityToken = parameters.accountAuth.token;
	}
	if (parameters.accountAuth.token) {
		config.defaultOrganizationUid = parameters.defaultOrganizationUid;
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
