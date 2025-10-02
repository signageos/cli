import { DEVICE_UID_OPTION, getDeviceUid } from '../deviceFacade';
import {
	getOrganization,
	getOrganizationUidOrDefaultOrSelect,
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
} from '../../Organization/organizationFacade';
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from '../../Applet/appletFacade';
import { createOrganizationRestApi } from '../../helper';
import { CommandLineOptions, createCommandDefinition } from '../../Command/commandDefinition';
import { createDevelopment } from '@signageos/sdk';
import wait from '../../Timer/wait';
import {
	DETACH_PROCESS_OPTION,
	FORWARD_SERVER_URL_OPTION,
	HOT_RELOAD_OPTION,
	killAppletServerIfRunningAndForceOption,
	SERVER_FORCE_OPTION,
	SERVER_PORT_OPTION,
	SERVER_PUBLIC_URL_OPTION,
} from '../../Applet/appletServerHelper';
import debug from 'debug';
import { APPLET_PATH_OPTION, getAppletDirectoryAbsolutePath } from '../../Applet/Upload/appletUploadCommandHelper';
import { parameters } from '../../parameters';

const Debug = debug('@signageos/cli:Device:Connect:connectCommand');

export const USE_FORWARD_SERVER_OPTION = {
	name: 'use-forward-server',
	type: Boolean,
	description:
		'Use forward server to connect to the device instead of the local network (LAN).' +
		" It's useful when the device is not in the same network as the local machine.",
} as const;

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	DEVICE_UID_OPTION,
	APPLET_UID_OPTION,
	SERVER_PUBLIC_URL_OPTION,
	SERVER_PORT_OPTION,
	SERVER_FORCE_OPTION,
	USE_FORWARD_SERVER_OPTION,
	DETACH_PROCESS_OPTION,
	FORWARD_SERVER_URL_OPTION,
	HOT_RELOAD_OPTION,
	APPLET_PATH_OPTION,
] as const;

/**
 * Establishes a connection between a signageOS device and the local development environment,
 * allowing real-time testing and debugging of applets during development. Supports both
 * local network (LAN) and forward server connections for different network configurations.
 *
 * The command sets up a development server and configures the device to load the applet
 * from the local machine, enabling hot reload and live debugging capabilities.
 *
 * @group Management:11
 *
 * @example
 * ```bash
 * # Connect device with basic configuration
 * sos device connect --device-uid device123 --applet-uid my-applet
 *
 * # Connect with custom server port
 * sos device connect --device-uid device123 --server-port 8080
 *
 * # Connect using forward server (for remote devices)
 * sos device connect --device-uid device123 --use-forward-server
 *
 * # Connect with hot reload enabled
 * sos device connect --device-uid device123 --hot-reload
 *
 * # Connect with custom organization
 * sos device connect --device-uid device123 --organization-uid org456
 *
 * # Connect with custom public URL
 * sos device connect --device-uid device123 --server-public-url https://my-domain.com
 *
 * # Connect and run in background
 * sos device connect --device-uid device123 --detach
 *
 * # Force connection (terminate existing servers)
 * sos device connect --device-uid device123 --force
 * ```
 *
 * @throws {Error} When device or applet cannot be found or accessed
 *
 * @throws {Error} When network connection to device fails
 *
 * @throws {Error} When development server cannot be started
 *
 * @throws {Error} When hot reload configuration is invalid
 *
 * @see {@link https://developers.signageos.io/docs/applets/connect-to-device-cli/ Device Connection and Development Documentation}
 *
 * @since 0.9.0
 */
export const connect = createCommandDefinition({
	name: 'connect',
	description: 'Connect device to local development server',
	optionList: OPTION_LIST,
	commands: [],
	run: async function (options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const dev = createDevelopment({
			organizationUid: organization.uid,
		});

		const appletUid = await getAppletUid(restApi, options);
		const appletVersion = await getAppletVersion(currentDirectory);
		const deviceUid = await getDeviceUid(restApi, options);

		const appletPort = options[SERVER_PORT_OPTION.name];
		const appletPublicUrl = options[SERVER_PUBLIC_URL_OPTION.name];
		const useForwardServer = options[USE_FORWARD_SERVER_OPTION.name];
		const hotReload = options[HOT_RELOAD_OPTION.name];

		await killAppletServerIfRunningAndForceOption(dev, options, appletUid, appletVersion, appletPort);

		let stoppable: { stop(): Promise<void> };
		let server: { remoteAddr: string; port: number; publicUrl: string };
		if (hotReload) {
			const appletPath = await getAppletDirectoryAbsolutePath(currentDirectory, options);
			const detachProcess = options[DETACH_PROCESS_OPTION.name];
			const forwardServerUrl = options[FORWARD_SERVER_URL_OPTION.name] ?? parameters.forwardServerUrl;
			const appletHotReload = await dev.applet.startHotReload({
				appletPath,
				port: appletPort,
				publicUrl: appletPublicUrl,
				detachProcess,
				forwardServerUrl,
			});
			stoppable = appletHotReload;
			server = appletHotReload.server;
		} else {
			const appletServer = await dev.applet.serve.serve({
				appletUid,
				appletVersion,
				port: appletPort,
				publicUrl: appletPublicUrl,
			});
			stoppable = appletServer;
			server = appletServer;
		}
		Debug('Server is running', stoppable);
		const finalAppletPublicUrl = useForwardServer ? server.publicUrl : `http://${server.remoteAddr}:${server.port}`;
		const connection = await dev.deviceConnect.connect(deviceUid, {
			appletUid,
			appletVersion,
			appletPublicUrl: finalAppletPublicUrl,
		});

		const stopServer = async () => {
			await connection.disconnect();
			await stoppable.stop();
			process.exit();
		};
		process.on('SIGINT', stopServer);
		process.on('SIGTERM', stopServer);

		console.info('Press Ctrl+C to disconnect');
		await wait(1e9); // Wait forever
	},
});
