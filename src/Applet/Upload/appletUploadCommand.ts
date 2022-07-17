import chalk from 'chalk';
import * as prompts from 'prompts';
import { createOrganizationRestApi, } from '../../helper';
import * as parameters from '../../../config/parameters';
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../../Organization/organizationFacade';
import {
	getAppletUid,
	getApplet,
} from '../appletFacade';
import {
	updateSingleFileApplet,
	updateMultiFileApplet,
	createSingleFileApplet,
	createMultiFileFileApplet,
} from './appletUploadFacade';
import {
	APPLET_PATH_OPTION,
	DEFAULT_APPLET_ENTRY_FILE_PATH,
	ENTRY_FILE_PATH_OPTION,
	getAppletBinaryFileAbsolutePath,
	getAppletDirectoryAbsolutePath,
	getAppletEntryFileAbsolutePath,
	getAppletEntryFileRelativePath,
} from './appletUploadCommandHelper';
import { listDirectoryContentRecursively, validateAllFormalities } from '../../FileSystem/helper';
import { createProgressBar } from '../../CommandLine/progressBarFactory';
import { saveToPackage } from '../../FileSystem/packageConfig';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';

export const OPTION_LIST = [
	APPLET_PATH_OPTION,
	ENTRY_FILE_PATH_OPTION,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{
		name: 'update-package-config',
		type: Boolean,
		description: `Force updating package.json with sos.appletUid value of created applet.`
			+ `It's useful when appletUid is passed using SOS_APPLET_UID environment variable.`,
	},
	{
		name: 'yes',
		type: Boolean,
		description: `Allow to upload new applet or override existing version without confirmation step`,
	},
	{
		name: 'verbose',
		type: Boolean,
		description: `outputs all files to upload`,
	},
] as const;

export const appletUpload = createCommandDefinition({
	name: 'upload',
	description: 'Uploads current applet version',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);

		const { name: appletName, version: appletVersion, frontAppletVersion } = await getApplet(currentDirectory);

		const appletPathOption = options['applet-path'] as string | undefined;
		const appletEntryOption = options['entry-file-path'] as string | undefined;
		const updatePackageConfig = options['update-package-config'] as boolean;

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

		let appletUid = await getAppletUid(restApi);
		if (!appletUid) {
			console.log(chalk.yellow(`applet uid is not present in package file, adding one.`));
			const createdApplet = await restApi.applet.create({ name: appletName });
			appletUid = createdApplet.uid;
			if (updatePackageConfig) {
				await saveToPackage(currentDirectory, { sos: { appletUid } });
			}
		}

		const applet = await restApi.applet.get(appletUid);

		await restApi.applet.version.get(appletUid, appletVersion).catch(() => appletVersionExists = false);

		const verbose = 'verbose';
		const allowVerbose = options[verbose] as boolean | undefined;
		const appletFiles: string[] = [];

		if (!isSingleFileApplet) {

			try {
				await validateAllFormalities(
					appletDirectoryPath!,
					options[ENTRY_FILE_PATH_OPTION.name] || DEFAULT_APPLET_ENTRY_FILE_PATH,
				);
			} catch (error) {
				throw error;
			}
			appletFiles.push(...(await listDirectoryContentRecursively(appletDirectoryPath!, currentDirectory)));
		}

		if (allowVerbose) {
			printUploadFiles(appletFiles);
		}

		const yes = 'yes';
		const skipConfirmation = options[yes] as boolean | undefined;

		if (appletVersionExists) {

			if (skipConfirmation) {

				console.log(chalk.yellow(`Will override existing version ${appletVersion}`));
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

				console.log(chalk.yellow(`Will create new version ${appletVersion}`));
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

		if (overrideAppletVersionConfirmed) {
			if (isSingleFileApplet) {
				await updateSingleFileApplet({
					restApi,
					applet: {
						uid: appletUid,
						version: appletVersion,
						binaryFilePath: appletBinaryFilePath!,
						frontAppletVersion,
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
						entryFilePath: appletEntryFileRelativePath,
						directoryPath: appletDirectoryPath!,
						files: appletFiles,
					},
					progressBar: progressBar,
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
						binaryFilePath: appletBinaryFilePath!,
						frontAppletVersion,
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
});

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

/**
 *
 * @param appletFiles files to upload
 */
function printUploadFiles(appletFiles: string[]): void {
	if (appletFiles.length > 0) {
		console.log(chalk.yellow(`Next files will be uploaded ...`));
	}
	appletFiles.forEach((file: string) => console.log(file));
}
