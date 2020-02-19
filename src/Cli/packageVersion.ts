import chalk from 'chalk';
import * as semver from 'semver';
import { exec } from 'child-process-promise';
import { getPackageVersion, getPackageName } from './helper';

export const VERSION_OPTION = {
	name: 'version',
	alias: 'v',
	type: Boolean,
	description: 'Display installed version of the CLI.',
};

export async function printVersion() {
	console.log(getPackageVersion());
	await printUpdateMessage();
}

export async function printUpdateMessage() {
	const packageName = getPackageName();
	const installedVersion = getPackageVersion();

	console.log('Checking updates...');

	const latestVersion = await getLatestVersion(packageName);
	const updateMessage = await getUpdateMessage(packageName, installedVersion, latestVersion);

	if (updateMessage) {
		console.log(updateMessage);
	}
}

export async function getLatestVersion(packageName: string) {
	try {
		const versionCommand = await exec(`npm show ${packageName} version`, { timeout: 10000 });
		const latestVersion = versionCommand.stdout.trim();

		return latestVersion;
	} catch (e) {
		return undefined;
	}
}

export async function getUpdateMessage(packageName: string, installedVersion: string, latestVersion?: string) {
	const NEW_VERSION_AVAILABLE_MESSAGE = ``
		+ chalk.bold.yellow(`New version of signageOS CLI Tool is available.\n`)
		+ `${chalk.bold(`Update your tool using`)} npm i ${packageName}@latest -g`;
	const INSTALLED_UP_TO_DATE_MESSAGE = chalk.bold.green(`Your tool is up to date.`);

	const newVersionIsAvailable = latestVersion ? semver.gt(latestVersion, installedVersion) : false;
	const installedIsUpToDate = installedVersion === latestVersion;

	if (newVersionIsAvailable) {
		return NEW_VERSION_AVAILABLE_MESSAGE;
	} else
	if (installedIsUpToDate) {
		return INSTALLED_UP_TO_DATE_MESSAGE;
	} else {
		return undefined;
	}
}
