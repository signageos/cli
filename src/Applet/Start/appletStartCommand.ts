import chalk from 'chalk';
import { createEmulator } from '../../Emulator/emulatorFactory';
import {
	getAppletEntryFileAbsolutePath,
	getAppletEntryFileRelativePath,
	APPLET_PATH_OPTION,
	ENTRY_FILE_PATH_OPTION,
	getAppletDirectoryAbsolutePath,
} from '../Upload/appletUploadCommandHelper';
import { loadEmulatorOrCreateNewAndReturnUid } from '../../Emulator/emulatorFacade';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import {
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { createDevelopment } from '@signageos/sdk/dist';
import { AppletHotReload } from '@signageos/sdk/dist/Development/Applet/AppletHotReload';
import wait from '../../Timer/wait';
import {
	killAppletServerIfRunningAndForceOption,
	SERVER_FORCE_OPTION,
	SERVER_PORT_OPTION,
	SERVER_PUBLIC_URL_OPTION,
	DETACH_PROCESS_OPTION,
	FORWARD_SERVER_URL_OPTION,
	HOT_RELOAD_OPTION,
} from '../appletServerHelper';
import { log } from '@signageos/sdk/dist/Console/log';
import { parameters } from '../../parameters';
import { validateAppletDirectory } from '../appletValidation';

const DEFAULT_PORT = 8090;
const PORT_OPTION = {
	name: 'port',
	type: Number,
	description: `Port where will the applet run`,
	defaultValue: 8090,
} as const;

export const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	PORT_OPTION,
	APPLET_PATH_OPTION,
	ENTRY_FILE_PATH_OPTION,
	HOT_RELOAD_OPTION,
	SERVER_PORT_OPTION,
	SERVER_PUBLIC_URL_OPTION,
	SERVER_FORCE_OPTION,
	DETACH_PROCESS_OPTION,
	FORWARD_SERVER_URL_OPTION,
] as const;

/**
 * Starts a local development server with hot reload functionality, allowing developers
 * to preview their applets in a browser-based emulator. Supports both local development
 * and device connection for testing on actual signageOS devices.
 *
 * @group Development:13
 *
 * @example
 * ```bash
 * # Start development server with default settings
 * sos applet start
 *
 * # Start with custom port and hot reload
 * sos applet start --port 8080 --hot-reload
 *
 * # Start with specific organization
 * sos applet start --organization-uid abc123
 *
 * # Start with custom applet path
 * sos applet start --applet-path ./my-applet
 *
 * # Start with specific entry file
 * sos applet start --entry-file-path index.html
 *
 * # Force restart if server is already running
 * sos applet start --force
 *
 * # Run in detached mode
 * sos applet start --detach
 * ```
 *
 * @remarks
 * The development server provides a browser-based emulator accessible at http://localhost:8090
 * by default. Hot reload automatically refreshes the emulator when source code changes.
 *
 * @throws {Error} When applet files are not found or invalid
 * @throws {Error} When organization is not accessible
 *
 * @see {@link https://developers.signageos.io/docs/applets/connect-to-device-cli/ Applet Development Documentation}
 *
 * @since 0.1.0
 */
export const appletStart = createCommandDefinition({
	name: 'start',
	description: 'Start local applet development server with live preview',
	optionList: OPTION_LIST,
	commands: [],
	async run(options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();

		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const appletPath = await getAppletDirectoryAbsolutePath(currentDirectory, options);
		await validateAppletDirectory(appletPath);

		const entryFileAbsolutePath = await getAppletEntryFileAbsolutePath(currentDirectory, options);
		const entryFileRelativePath = getAppletEntryFileRelativePath(entryFileAbsolutePath, appletPath);
		const emulatorUid = await loadEmulatorOrCreateNewAndReturnUid(organizationUid);
		const dev = createDevelopment({
			organizationUid,
		});

		const emulatorServerPort = options[PORT_OPTION.name] ?? DEFAULT_PORT;
		const hotReloadEnabled = options[HOT_RELOAD_OPTION.name];
		const appletPort = options[SERVER_PORT_OPTION.name];
		const appletPublicUrl = options[SERVER_PUBLIC_URL_OPTION.name];
		const detachProcess = options[DETACH_PROCESS_OPTION.name];
		const forwardServerUrl = options[FORWARD_SERVER_URL_OPTION.name] ?? parameters.forwardServerUrl;

		let appletUid: string | undefined;
		let appletVersion: string | undefined;
		try {
			({ appletUid, appletVersion } = await dev.applet.identification.getAppletUidAndVersion(appletPath));
		} catch {
			log('warning', chalk.yellow('Applet is not uploaded yet. It cannot be developed on real device.'));
		}

		await killAppletServerIfRunningAndForceOption(dev, options, appletUid, appletVersion, appletPort);

		let appletHotReload: AppletHotReload | undefined;

		if (hotReloadEnabled) {
			appletHotReload = await dev.applet.startHotReload({
				appletPath: appletPath,
				port: appletPort,
				publicUrl: appletPublicUrl,
				detachProcess,
				forwardServerUrl,
			});
		}

		const createEmulatorParams = {
			emulatorUid,
			appletUid,
			appletVersion,
			appletPath,
			entryFileRelativePath,
			emulatorServerPort,
		};
		const emulator = await createEmulator(createEmulatorParams, organizationUid, dev);

		const stopServer = async () => {
			await appletHotReload?.stop();
			await emulator.stop();
			process.exit();
		};
		process.on('SIGINT', stopServer);
		process.on('SIGTERM', stopServer);

		console.info('Press Ctrl+C to stop');
		await wait(1e9); // Wait forever
	},
});
