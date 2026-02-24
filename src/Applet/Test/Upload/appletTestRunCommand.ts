import chalk from 'chalk';
import prompts from 'prompts';
import { createOrganizationRestApi } from '../../../helper';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../../Organization/organizationFacade';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from '../../appletFacade';
import { createProgressBar } from '../../../CommandLine/progressBarFactory';
import { DEVICE_UID_OPTION, getDeviceUid } from '../../../Device/deviceFacade';
import { validateTestIdentifiers } from './appletTestRunFacade';
import wait from '../../../Timer/wait';
import IDeviceAppletTest from '@signageos/sdk/dist/RestApi/Device/AppletTest/IDeviceAppletTest';
import IAppletTestSuite from '@signageos/sdk/dist/RestApi/Applet/Version/IAppletTestSuite';
import { CommandLineOptions, createCommandDefinition } from '../../../Command/commandDefinition';
import { log } from '@signageos/sdk/dist/Console/log';
import { validateAppletDirectory } from '../../appletValidation';

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	DEVICE_UID_OPTION,
	ORGANIZATION_UID_OPTION,
	APPLET_UID_OPTION,
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
] as const;

/**
 * Executes previously uploaded applet tests on remote signageOS devices. This command
 * triggers test execution and provides real-time feedback on test progress and results.
 * Tests can be run on specific devices or across multiple devices for comprehensive testing.
 *
 * @group Development:142
 *
 * @example
 * ```bash
 * # Run all applet tests
 * sos applet test run --applet-uid my-applet --device-uid device123
 *
 * # Run specific tests
 * sos applet test run --applet-uid my-applet --device-uid device123 --test "test1,test2"
 *
 * # Run without confirmation
 * sos applet test run --applet-uid my-applet --device-uid device123 --yes
 * ```
 *
 * @see {@link ../upload/ Upload test configuration command}
 *
 * @since 0.10.0
 */
export const appletTestRun = createCommandDefinition({
	name: 'run',
	description: 'Run applet tests on signageOS devices',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const skipConfirmation = !!options.yes;
		let tests = options.test;

		const currentDirectory = process.cwd();
		await validateAppletDirectory(currentDirectory);

		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options, skipConfirmation);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const device = await restApi.device.get(deviceUid);

		const version = await getAppletVersion(currentDirectory);
		const appletUid = await getAppletUid(restApi, options);

		const applet = await restApi.applet.get(appletUid);
		const appletVersion = await restApi.applet.version.get(appletUid, version);

		const testSuites = await restApi.applet.tests.list(applet.uid, appletVersion.version);

		if (!tests || tests.length === 0) {
			tests = testSuites.map((testSuite: IAppletTestSuite) => testSuite.identifier);
		}

		// At this point tests should be defined, but TypeScript doesn't know that
		const testsToRun: string[] = tests || [];

		validateTestIdentifiers(testsToRun, testSuites);
		printRunTests(testsToRun);

		if (!skipConfirmation) {
			const response: prompts.Answers<'continue'> = await prompts({
				type: 'confirm',
				name: 'continue',
				message:
					`Do you want to start testing ${chalk.green(applet.name)} ` + `and version ${chalk.green(version)} on device ${device.name}?`,
			});
			if (!response.continue) {
				throw new Error(`Applet tests canceled`);
			}
		}

		const RUNNING_TEST_TITLE = `Running applet tests`;
		const progressBar = createProgressBar();
		try {
			progressBar.init({
				size: testsToRun.length,
				name: RUNNING_TEST_TITLE,
			});

			await restApi.device.appletTest.run(device.uid, applet.uid, appletVersion.version, testsToRun);

			let deviceAppletTest: IDeviceAppletTest | undefined;
			do {
				await wait(1e3);
				const lastCountFinished = (deviceAppletTest?.successfulTests.length ?? 0) + (deviceAppletTest?.failedTests.length ?? 0);
				deviceAppletTest = await restApi.device.appletTest.get(device.uid, applet.uid, appletVersion.version);
				const nextCountFinished = (deviceAppletTest?.successfulTests.length ?? 0) + (deviceAppletTest?.failedTests.length ?? 0);
				const progressName =
					RUNNING_TEST_TITLE +
					' ' +
					[
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
});

function displaySuccessMessage(appletName: string, appletVersion: string, deviceAppletTest: IDeviceAppletTest) {
	log('info', `Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} tests ${chalk.green('succeeded')}.`);
	deviceAppletTest.successfulTests.forEach((file: string) => log('info', chalk.green('✓ ' + file)));
}

function displayFailureMessage(appletName: string, appletVersion: string, deviceAppletTest: IDeviceAppletTest) {
	log('info', `Applet ${chalk.green(appletName)} version ${chalk.green(appletVersion)} tests ${chalk.red('failed')}.`);
	deviceAppletTest.failedTests.forEach((file: string) => log('info', chalk.red('× ' + file)));
	deviceAppletTest.successfulTests.forEach((file: string) => log('info', chalk.green('✓ ' + file)));
}

function printRunTests(identifiers: string[]): void {
	if (identifiers.length > 0) {
		log('info', chalk.yellow(`Next test files are going to be run...`));
	}
	identifiers.forEach((file: string) => log('info', file));
}
