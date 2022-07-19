import chalk from 'chalk';
import * as prompts from 'prompts';
import { createOrganizationRestApi, } from '../../../helper';
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from '../../../Organization/organizationFacade';
import { loadTestFilesContents, validateTestFiles } from './appletTestUploadFacade';
import {
	getAppletUid,
	getAppletVersion,
} from '../../appletFacade';
import { createProgressBar } from '../../../CommandLine/progressBarFactory';
import { loadPackage } from '../../../FileSystem/packageConfig';
import IAppletTestSuite from '@signageos/sdk/dist/RestApi/Applet/Version/IAppletTestSuite';
import { CommandLineOptions, createCommandDefinition } from '../../../Command/commandDefinition';

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{
		name: 'yes',
		type: Boolean,
		description: `Allow to upload new applet test or override existing test without confirmation step`,
	},
	{
		name: 'verbose',
		type: Boolean,
		description: `outputs all files to upload`,
	},
] as const;

export const appletTestUpload = createCommandDefinition({
	name: 'upload',
	description: 'Uploads applet test',
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
		const appletUid = await getAppletUid(restApi);
		if (!appletUid) {
			throw new Error('Not selected Applet or sos.appletUid is not present in package.json');
		}

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
		const identifiersToUpdate = testFiles
		.filter((testFile) => !identifiersToCreate.includes(testFile) && testSuitesMap[testFile]?.binary !== testFilesContents[testFile]);
		const identifiersToDelete = Object.keys(testSuitesMap).filter((identifier) => !testFiles.includes(identifier));

		printChangesFiles({ identifiersToCreate, identifiersToUpdate, identifiersToDelete });

		if (!skipConfirmation) {
			const response: prompts.Answers<"continue"> = await prompts({
				type: 'confirm',
				name: 'continue',
				message: `Do you want to do applet version test changes for applet ${chalk.green(applet.name)} `
				+ `and version ${chalk.green(version)}?`,
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
						binary: testFilesContents[identifier],
					});
					progressBar.update({ add: 1 });
				}),
				...identifiersToUpdate.map(async (identifier) => {
					await restApi.applet.tests.update(applet.uid, appletVersion.version, identifier, {
						binary: testFilesContents[identifier],
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

function displaySuccessMessage(
	appletName: string,
	appletVersion: string,
) {
	console.log(`Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} tests has been uploaded.`);
	console.log(`To run the tests, use command ${chalk.blue(`sos applet test run`)}`);
}

function printMatchedFiles(testFiles: string[]): void {
	if (testFiles.length > 0) {
		console.log(chalk.yellow(`Next files are going to be checked for upload...`));
	}
	testFiles.forEach((file: string) => console.log(file));
}

type IChangedFiles = {
	identifiersToCreate: string[];
	identifiersToUpdate: string[];
	identifiersToDelete: string[];
};

function printChangesFiles({ identifiersToCreate, identifiersToUpdate, identifiersToDelete }: IChangedFiles): void {
	if (identifiersToCreate.length > 0) {
		console.log(chalk.yellow(`Next files is being created...`));
		identifiersToCreate.forEach((file: string) => console.log(file));
	}
	if (identifiersToUpdate.length > 0) {
		console.log(chalk.yellow(`Next files is being updated...`));
		identifiersToUpdate.forEach((file: string) => console.log(file));
	}
	if (identifiersToDelete.length > 0) {
		console.log(chalk.yellow(`Next files is being deleted...`));
		identifiersToDelete.forEach((file: string) => console.log(file));
	}
}
