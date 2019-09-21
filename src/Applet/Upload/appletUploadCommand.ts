import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as prompts from 'prompts';
import ICommand from '../../Command/ICommand';
import { CommandLineOptions } from 'command-line-args';
import { createOrganizationRestApi, deserializeJSON } from '../../helper';
import { loadConfig, updateConfig } from '../../RunControl/runControlHelper';
import { getOrganization, getOrganizationUid, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import { getAppletName, getAppletVersion, getAppletFrontAppletVersion, tryGetAppletUid } from '../appletFacade';
import * as parameters from '../../../config/parameters';

const DEFAULT_APPLET_BINARY_FILE_PATH = 'dist/index.html';

export const appletUpload: ICommand = {
	name: 'upload',
	description: 'Uploads current applet version',
	optionList: [
		{
			name: 'applet-path',
			type: String,
			defaultValue: DEFAULT_APPLET_BINARY_FILE_PATH,
			description: 'Path to the applet file. Relative to the command or absolute.',
		},
		ORGANIZATION_UID_OPTION,
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidAndUpdateConfig(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);

		const appletName = await getAppletName(currentDirectory);
		const appletVersion = await getAppletVersion(currentDirectory);
		const appletBinaryFilePath = await getAppletBinaryFileAbsolutePath(currentDirectory, options);
		const appletFrontAppletVersion = await getAppletFrontAppletVersion(currentDirectory);

		const appletBinaryFilePathExists = await fs.pathExists(appletBinaryFilePath);

		if (!appletBinaryFilePathExists) {
			throw new Error(`Applet binary file not found: ${appletBinaryFilePath}`);
		}

		let appletVersionExists = true;
		let overrideAppletVersionConfirmed = false;
		let createNewAppletVersionConfirmed = false;

		let appletUid = await tryGetAppletUid(currentDirectory);
		if (!appletUid) {
			const createdApplet = await restApi.applet.create({ name: appletName });
			appletUid = createdApplet.uid;
			await saveToPackage(currentDirectory, { sos: { appletUid } });
		}

		const applet = await restApi.applet.get(appletUid);

		await restApi.applet.version.get(appletUid, appletVersion).catch(() => appletVersionExists = false);

		if (appletVersionExists) {
			const response = await prompts({
				type: 'confirm',
				name: 'override',
				message: `Do you want to override applet version ${appletVersion}?`,
			});
			overrideAppletVersionConfirmed = response.override ? true : false;
		} else {
			const response = await prompts({
				type: 'confirm',
				name: 'newVersion',
				message: `Do you want to create new applet version ${appletVersion}?`,
			});
			createNewAppletVersionConfirmed = response.newVersion ? true : false;
		}

		if (overrideAppletVersionConfirmed) {
			const appletBinary = await fs.createReadStream(appletBinaryFilePath, { encoding: 'utf8' });
			await restApi.applet.version.update(
				appletUid,
				appletVersion,
				{
					binary: appletBinary,
					frontAppletVersion: '',
				},
			);
		} else if (createNewAppletVersionConfirmed) {
			const appletBinary = await fs.createReadStream(appletBinaryFilePath, { encoding: 'utf8' });
			await restApi.applet.version.create(
				appletUid,
				{
					binary: appletBinary,
					version: appletVersion,
					frontAppletVersion: appletFrontAppletVersion,
				},
			);
			console.log(`Applet ${chalk.green(applet.name!)} version ${chalk.green(appletVersion)} has been uploaded.`);
			const appletBoxUri = `https://${parameters.boxHost}/applet/${applet.uid}/${appletVersion}/build`;
			console.log(`To build specific applications (Tizen, WebOS, SSSP, BrightSign, RPi, Android etc.) go to ${chalk.blue(appletBoxUri)}`);
		} else {
			throw new Error('Applet version upload was canceled.');
		}
	},
};

async function getOrganizationUidAndUpdateConfig(options: CommandLineOptions): Promise<string> {
	const config = await loadConfig();
	let organizationUid: string | undefined = options['organization-uid'];

	if (!organizationUid) {
		organizationUid = config.defaultOrganizationUid;
	}

	if (!organizationUid) {
		organizationUid = await getOrganizationUid(options);
		await updateConfig({
			defaultOrganizationUid: organizationUid,
		});
	}

	return organizationUid;
}

function getAppletBinaryFileAbsolutePath(currentDirectory: string, options: CommandLineOptions): string {
	let appletBinaryFilePath: string = options['applet-path'];

	if (appletBinaryFilePath === DEFAULT_APPLET_BINARY_FILE_PATH) {
		console.log(`\nUsed default applet binary file path: ${appletBinaryFilePath}`);
	}
	if (!path.isAbsolute(appletBinaryFilePath)) {
		appletBinaryFilePath = path.join(currentDirectory, appletBinaryFilePath);
		console.log(`\nWill upload applet binary file path: ${appletBinaryFilePath}`);
	}

	return appletBinaryFilePath;
}

async function saveToPackage(currentDirectory: string, data: any) {
	const packageJSONPath = path.join(currentDirectory, 'package.json');
	const packageJSONPathExists = await fs.pathExists(packageJSONPath);
	let previousContent;

	if (packageJSONPathExists) {
		const packageRaw = await fs.readFile(packageJSONPath, { encoding: 'utf8' });
		previousContent = JSON.parse(packageRaw, deserializeJSON);
	}

	const newContent = { ...previousContent, ...data };
	await fs.writeFile(packageJSONPath, JSON.stringify(newContent, undefined, 2) + '\n');
}
