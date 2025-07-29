import { createCommandDefinition } from '../../Command/commandDefinition';
import { appletTestRun } from './Upload/appletTestRunCommand';
import { appletTestUpload } from './Upload/appletTestUploadCommand';

/**
 * Provides commands for testing applets on the signageOS platform, including
 * uploading test configurations and running remote tests on actual devices.
 *
 * @group Development:4
 *
 * @example
 * ```bash
 * # Upload test configuration
 * sos applet test upload
 *
 * # Run tests remotely
 * sos applet test run
 * ```
 *
 * @since 0.10.0
 */
export const appletTest = createCommandDefinition({
	name: 'test',
	description: 'Applet test management',
	optionList: [],
	commands: [appletTestUpload, appletTestRun],
	async run() {
		throw new Error('Unknown command');
	},
});
