import chalk from 'chalk';
import prompts from 'prompts';
import { createOrganizationRestApi } from '../../../helper';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../../Organization/organizationFacade';
import { loadTestFilesContents, validateTestFiles } from './appletTestUploadFacade';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from '../../appletFacade';
import { createProgressBar } from '../../../CommandLine/progressBarFactory';
import { loadPackage } from '@signageos/sdk/dist/FileSystem/packageConfig';
import IAppletTestSuite from '@signageos/sdk/dist/RestApi/Applet/Version/IAppletTestSuite';
import { CommandLineOptions, createCommandDefinition } from '../../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	APPLET_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: `Allow to upload new applet test or override existing test without confirmation step`,
	},
	{
		name: 'verbose',
		type: Boolean,
		description: `Outputs all files to upload`,
	},
] as const;

/**
 * Uploads test files for remote execution on signageOS devices. Test files are
 * identified based on the test configuration in package.json and uploaded to
 * the platform for automated testing. Supports incremental uploads with
 * change detection and confirmation prompts.
 *
 * @group Development:141
 *
 * @example
 * ```bash
 * # Upload applet tests
 * sos applet test upload
 *
 * # Upload tests with confirmation skip
 * sos applet test upload --yes
 *
 * # Upload tests with verbose output
 * sos applet test upload --verbose
 *
 * # Upload tests for specific applet
 * sos applet test upload --applet-uid my-applet-uid
 * ```
 *
 * @throws {Error} When package.json is missing or test configuration is invalid
 * @throws {Error} When test files cannot be found or read
 * @throws {Error} When applet or organization access is denied
 * @throws {Error} When test upload confirmation is denied
 *
 * @since 0.10.0
 */
export const appletTestUpload = createCommandDefinition({
	name: 'upload',
	description: 'Upload applet tests to the signageOS platform',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const isVerbose = !!options.verbose;
		const skipConfirmation = !!options.yes;

		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);

		const version = await getAppletVersion(currentDirectory);
		const appletUid = await getAppletUid(restApi, options);

		const applet = await restApi.applet.get(appletUid);
		const appletVersion = await restApi.applet.version.get(appletUid, version);

		const packageConfig = await loadPackage(currentDirectory);
		if (!packageConfig?.sos?.tests) {
			throw new Error(`No key "sos.tests" found in package.json file. You have to specify all testing files there first.`);
		}
		const testFiles = packageConfig?.sos.tests;
		await validateTestFiles(currentDirectory, testFiles);

		if (isVerbose) {
			printMatchedFiles(testFiles);
		}

		const testSuites = await restApi.applet.tests.list(applet.uid, appletVersion.version);
		const testSuitesMap: { [identifier: string]: IAppletTestSuite } = {};
		for (const testSuite of testSuites) {
			testSuitesMap[testSuite.identifier] = testSuite;
		}
		const testFilesContents = await loadTestFilesContents(currentDirectory, testFiles);

		const identifiersToCreate = testFiles.filter((testFile) => testSuitesMap[testFile] === undefined);
		const identifiersToUpdate = testFiles.filter(
			(testFile) => !identifiersToCreate.includes(testFile) && testSuitesMap[testFile]?.binary !== testFilesContents[testFile],
		);
		const identifiersToDelete = Object.keys(testSuitesMap).filter((identifier) => !testFiles.includes(identifier));

		printChangesFiles({ identifiersToCreate, identifiersToUpdate, identifiersToDelete });

		if (!skipConfirmation) {
			const response: prompts.Answers<'continue'> = await prompts({
				type: 'confirm',
				name: 'continue',
				message:
					`Do you want to do applet version test changes for applet ${chalk.green(applet.name)} ` + `and version ${chalk.green(version)}?`,
			});
			if (!response.continue) {
				throw new Error(`Uploading applet tests canceled`);
			}
		}

		const progressBar = createProgressBar();
		try {
			progressBar.init({
				size: identifiersToCreate.length + identifiersToUpdate.length + identifiersToDelete.length,
				name: `Uploading applet test files`,
			});

			await Promise.all([
				...identifiersToCreate.map(async (identifier) => {
					await restApi.applet.tests.create(applet.uid, appletVersion.version, {
						identifier,
						binary: testFilesContents[identifier] ?? '',
					});
					progressBar.update({ add: 1 });
				}),
				...identifiersToUpdate.map(async (identifier) => {
					await restApi.applet.tests.update(applet.uid, appletVersion.version, identifier, {
						binary: testFilesContents[identifier] ?? '',
					});
					progressBar.update({ add: 1 });
				}),
				...identifiersToDelete.map(async (identifier) => {
					await restApi.applet.tests.delete(applet.uid, appletVersion.version, identifier);
					progressBar.update({ add: 1 });
				}),
			]);
			displaySuccessMessage(applet.name, appletVersion.version);
		} finally {
			progressBar.end();
		}
	},
});

function displaySuccessMessage(appletName: string, appletVersion: string) {
	log('info', `Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} tests has been uploaded.`);
	log('info', `To run the tests, use command ${chalk.blue(`sos applet test run`)}`);
}

function printMatchedFiles(testFiles: string[]): void {
	if (testFiles.length > 0) {
		log('info', chalk.yellow(`Next files are going to be checked for upload...`));
	}
	testFiles.forEach((file: string) => log('info', file));
}

type IChangedFiles = {
	identifiersToCreate: string[];
	identifiersToUpdate: string[];
	identifiersToDelete: string[];
};

function printChangesFiles({ identifiersToCreate, identifiersToUpdate, identifiersToDelete }: IChangedFiles): void {
	if (identifiersToCreate.length > 0) {
		log('info', chalk.yellow(`Next files is being created...`));
		identifiersToCreate.forEach((file: string) => log('info', file));
	}
	if (identifiersToUpdate.length > 0) {
		log('info', chalk.yellow(`Next files is being updated...`));
		identifiersToUpdate.forEach((file: string) => log('info', file));
	}
	if (identifiersToDelete.length > 0) {
		log('info', chalk.yellow(`Next files is being deleted...`));
		identifiersToDelete.forEach((file: string) => log('info', file));
	}
}
