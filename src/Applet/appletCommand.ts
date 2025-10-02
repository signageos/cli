import { appletGenerate } from './Generate/appletGenerateCommand';
import { appletUpload } from './Upload/appletUploadCommand';
import { appletStart } from './Start/appletStartCommand';
import { appletTest } from './Test/appletTestCommand';
import { createCommandDefinition } from '../Command/commandDefinition';
import { appletBuild } from './Build/appletBuildCommand';

/**
 * Provides comprehensive commands for the complete applet development lifecycle including
 * project generation, development, building, testing, uploading, and deployment to signageOS devices.
 *
 * @group Development:100
 *
 * @subcommands
 * - `generate` - Create a new applet project with boilerplate code
 * - `start` - Start local development server with hot reload
 * - `build` - Build applet for production deployment
 * - `upload` - Upload applet to signageOS platform
 * - `test` - Run and upload applet tests
 *
 * @example
 * ```bash
 * # Create new applet project
 * sos applet generate --name my-applet
 *
 * # Start development server
 * sos applet start
 *
 * # Build for production
 * sos applet build
 *
 * # Upload to platform
 * sos applet upload
 * ```
 *
 * @see {@link https://developers.signageos.io/docs/applets/ Applet Documentation}
 *
 * @since 0.1.0
 */
export const applet = createCommandDefinition({
	name: 'applet',
	description: 'Applet development and management operations',
	optionList: [],
	commands: [appletGenerate, appletUpload, appletStart, appletTest, appletBuild],
	async run() {
		throw new Error('Unknown command');
	},
});
