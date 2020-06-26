import chalk from 'chalk';
import * as prompts from 'prompts';
import { CommandLineOptions } from 'command-line-args';
import ICommand from '../../Command/ICommand';
import { createOrganizationRestApi } from '../../helper';
import * as parameters from '../../../config/parameters';
import { getOrganization, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import {
	getAppletName,
	getAppletVersion,
	getAppletFrontAppletVersion,
	tryGetAppletUid,
} from '../appletFacade';
import {
	updateSingleFileApplet,
	updateMultiFileApplet,
	createSingleFileApplet,
	createMultiFileFileApplet,
} from './appletUploadFacade';
import {
	getOrganizationUidAndUpdateConfig,
	getAppletBinaryFileAbsolutePath,
	getAppletDirectoryAbsolutePath,
	getAppletEntryFileAbsolutePath,
	getAppletEntryFileRelativePath,
	saveToPackage,
} from './appletUploadCommandHelper';
import { listDirectoryContentRecursively } from '../../FileSystem/helper';
import { createProgressBar } from '../../CommandLine/progressBarFactory';

export const ENTRY_FILE_PATH_OPTION = {
	name: 'entry-file-path',
	type: String,
	// defaultValue: DEFAULT_APPLET_ENTRY_FILE_PATH,
	description: 'Path to the applet entry file. Relative to the command or absolute.',
};

export const appletUpload: ICommand = {
	name: 'upload',
	description: 'Uploads current applet version',
	optionList: [
		{
			name: 'applet-path',
			type: String,
			// defaultValue: DEFAULT_APPLET_DIR_PATH,
			description: 'Path to the applet file or the project folder depending on the entry file. Relative to the command or absolute.',
		},
		ENTRY_FILE_PATH_OPTION,
		ORGANIZATION_UID_OPTION,
		{
			name: 'yes',
			type: Boolean,
			description: `Allow to upload new applet or override existing version without confirmation step`,
		},
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidAndUpdateConfig(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);

		const appletName = await getAppletName(currentDirectory);
		const appletVersion = await getAppletVersion(currentDirectory);
		const appletFrontAppletVersion = await getAppletFrontAppletVersion(currentDirectory);

		const appletPathOption = options['applet-path'] as string | undefined;
		const appletEntryOption = options['entry-file-path'] as string | undefined;

		let appletBinaryFilePath: string | undefined = undefined;
		let appletDirectoryPath: string | undefined = undefined;
		let appletEntryFilePath: string | undefined = undefined;

		const isSingleFileApplet = !!(appletPathOption && !appletEntryOption);
		if (isSingleFileApplet) {
			displaySingleFileAppletDeprecationNote();
			appletBinaryFilePath = await getAppletBinaryFileAbsolutePath(currentDirectory, options);
		} else {
			appletDirectoryPath = await getAppletDirectoryAbsolutePath(currentDirectory, options);
			appletEntryFilePath = await getAppletEntryFileAbsolutePath(currentDirectory, options);
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

		const yes = 'yes';
		const skipConfirmation = options[yes] as boolean | undefined;

		if (appletVersionExists) {

			if (skipConfirmation) {

				console.log(`Will override existing version ${appletVersion}`);
				overrideAppletVersionConfirmed = true;

			} else {
				const response: prompts.Answers<"override"> = await prompts({
					type: 'confirm',
					name: 'override',
					message: `Do you want to override applet version ${appletVersion}?`,
				});
				overrideAppletVersionConfirmed = response.override;
			}

		} else {

			if (skipConfirmation) {

				console.log(`Will create new version ${appletVersion}`);
				createNewAppletVersionConfirmed = true;

			} else {
				const response: prompts.Answers<"newVersion"> = await prompts({
					type: 'confirm',
					name: 'newVersion',
					message: `Do you want to create new applet version ${appletVersion}?`,
				});
				createNewAppletVersionConfirmed = response.newVersion;
			}
		}

		const appletFiles: string[] = [];
		if (overrideAppletVersionConfirmed || createNewAppletVersionConfirmed) {
			if (!isSingleFileApplet) {
				appletFiles.push(...(await listDirectoryContentRecursively(appletDirectoryPath!, currentDirectory)));
			}
		}

		if (overrideAppletVersionConfirmed) {
			if (isSingleFileApplet) {
				await updateSingleFileApplet({
					restApi,
					applet: {
						uid: appletUid,
						version: appletVersion,
						frontAppletVersion: appletFrontAppletVersion,
						binaryFilePath: appletBinaryFilePath!,
					},
				});
			} else {
				const appletEntryFileRelativePath = getAppletEntryFileRelativePath(appletEntryFilePath!, appletDirectoryPath!);
				const progressBar = createProgressBar();
				await updateMultiFileApplet({
					restApi,
					applet: {
						uid: appletUid,
						version: appletVersion,
						frontAppletVersion: appletFrontAppletVersion,
						entryFilePath: appletEntryFileRelativePath,
						directoryPath: appletDirectoryPath!,
						files: appletFiles,
					},
					progressBar,
				});
			}
			displaySuccessMessage(applet.uid, applet.name!, appletVersion, parameters.boxHost);
		} else if (createNewAppletVersionConfirmed) {
			if (isSingleFileApplet) {
				await createSingleFileApplet({
					restApi,
					applet: {
						uid: appletUid,
						version: appletVersion,
						frontAppletVersion: appletFrontAppletVersion,
						binaryFilePath: appletBinaryFilePath!,
					},
				});
			} else {
				const appletEntryFileRelativePath = getAppletEntryFileRelativePath(appletEntryFilePath!, appletDirectoryPath!);
				const progressBar = createProgressBar();
				await createMultiFileFileApplet({
					restApi,
					applet: {
						uid: appletUid,
						version: appletVersion,
						frontAppletVersion: appletFrontAppletVersion,
						entryFilePath: appletEntryFileRelativePath,
						directoryPath: appletDirectoryPath!,
						files: appletFiles,
					},
					progressBar,
				});
			}
			displaySuccessMessage(applet.uid, applet.name!, appletVersion, parameters.boxHost);
		} else {
			throw new Error('Applet version upload was canceled.');
		}
	},
};

function displaySuccessMessage(
	appletUid: string,
	appletName: string,
	appletVersion: string,
	boxHost: string,
) {
	console.log(`Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} has been uploaded.`);
	const appletBoxUri = `https://${boxHost}/applet/${appletUid}/${appletVersion}/build`;
	console.log(`To build specific applications (Tizen, WebOS, SSSP, BrightSign, RPi, Android etc.) go to ${chalk.blue(appletBoxUri)}`);
}

function displaySingleFileAppletDeprecationNote() {
	console.log(
		`${chalk.red(`Applets with only applet-path file are ${chalk.bold(`deprecated`)}.`)} Please find more information at our website.`,
	);
}
