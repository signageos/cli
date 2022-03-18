import chalk from 'chalk';
import * as prompts from 'prompts';
import { CommandLineOptions } from 'command-line-args';
import ICommand from '../../../Command/ICommand';
import { createOrganizationRestApi, } from '../../../helper';
import { getOrganization, ORGANIZATION_UID_OPTION } from '../../../Organization/organizationFacade';
import {
	getAppletUid,
	getAppletVersion,
} from '../../appletFacade';
import {
	getOrganizationUidAndUpdateConfig,
} from '../../Upload/appletUploadCommandHelper';
import { createProgressBar } from '../../../CommandLine/progressBarFactory';
import { DEVICE_UID_OPTION, getDeviceUid } from '../../../Device/deviceFacade';
import { validateTestIdentifiers } from './appletTestRunFacade';
import wait from '../../../Timer/wait';
import IDeviceAppletTest from '@signageos/sdk/dist/RestApi/Device/AppletTest/IDeviceAppletTest';

export const appletTestRun: ICommand = {
	name: 'run',
	description: 'Runs applet tests',
	optionList: [
		DEVICE_UID_OPTION,
		ORGANIZATION_UID_OPTION,
		{
			name: 'test',
			type: String,
			multiple: true,
			description: `Specify the test identifiers/files to be run. If not specified, all will be run.`,
		},
		{
			name: 'yes',
			type: Boolean,
			description: `Allow to run applet test without confirmation step`,
		},
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const skipConfirmation = !!options.yes;
		let tests: string[] | null = options.test;

		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidAndUpdateConfig(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const device = await restApi.device.get(deviceUid);

		const version = await getAppletVersion(currentDirectory);
		const appletUid = await getAppletUid(restApi);
		if (!appletUid) {
			throw new Error('Not selected Applet or sos.appletUid is not present in package.json');
		}

		const applet = await restApi.applet.get(appletUid);
		const appletVersion = await restApi.applet.version.get(appletUid, version);

		const testSuites = await restApi.applet.tests.list(applet.uid, appletVersion.version);
		if (!tests || tests.length === 0) {
			tests = testSuites.map((testSuite) => testSuite.identifier);
		}

		validateTestIdentifiers(tests, testSuites);
		printRunTests(tests);

		if (!skipConfirmation) {
			const response: prompts.Answers<"continue"> = await prompts({
				type: 'confirm',
				name: 'continue',
				message: `Do you want to start testing ${chalk.green(applet.name)} `
				+ `and version ${chalk.green(version)} on device ${device.name}?`,
			});
			if (!response.continue) {
				throw new Error(`Applet tests canceled`);
			}
		}

		const RUNNING_TEST_TITLE = `Running applet tests`;
		const progressBar = createProgressBar();
		try {
			progressBar.init({
				size: tests.length,
				name: RUNNING_TEST_TITLE,
			});

			await restApi.device.appletTest.run(device.uid, applet.uid, appletVersion.version, tests);

			let deviceAppletTest: IDeviceAppletTest | undefined;
			do {
				await wait(1e3);
				const lastCountFinished = (deviceAppletTest?.successfulTests.length ?? 0) + (deviceAppletTest?.failedTests.length ?? 0);
				deviceAppletTest = await restApi.device.appletTest.get(device.uid, applet.uid, appletVersion.version);
				const nextCountFinished = (deviceAppletTest?.successfulTests.length ?? 0) + (deviceAppletTest?.failedTests.length ?? 0);
				const progressName = RUNNING_TEST_TITLE + ' ' + [
					...deviceAppletTest.failedTests.map((t) => chalk.red(t)),
					...deviceAppletTest.successfulTests.map((t) => chalk.green(t)),
					...deviceAppletTest.pendingTests.map((t) => chalk.gray(t)),
				].join(',');
				progressBar.update({
					add: nextCountFinished - lastCountFinished,
					name: progressName,
				});
			} while (!deviceAppletTest?.finishedAt);

			if (deviceAppletTest.failedTests.length > 0) {
				displayFailureMessage(applet.name, appletVersion.version, deviceAppletTest);
				throw new Error(`Tests run failed`);
			} else {
				displaySuccessMessage(applet.name, appletVersion.version, deviceAppletTest);
			}
		} finally {
			progressBar.end();
		}
	},
};

function displaySuccessMessage(
	appletName: string,
	appletVersion: string,
	deviceAppletTest: IDeviceAppletTest,
) {
	console.log(`Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} tests ${chalk.green('succeeded')}.`);
	deviceAppletTest.successfulTests.forEach((file: string) => console.log(chalk.green('✓ ' + file)));
}

function displayFailureMessage(
	appletName: string,
	appletVersion: string,
	deviceAppletTest: IDeviceAppletTest,
) {
	console.log(`Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} tests ${chalk.red('failed')}.`);
	deviceAppletTest.failedTests.forEach((file: string) => console.log(chalk.red('× ' + file)));
	deviceAppletTest.successfulTests.forEach((file: string) => console.log(chalk.green('✓ ' + file)));
}

function printRunTests(identifiers: string[]): void {
	if (identifiers.length > 0) {
		console.log(chalk.yellow(`Next test files are going to be run...`));
	}
	identifiers.forEach((file: string) => console.log(file));
}
