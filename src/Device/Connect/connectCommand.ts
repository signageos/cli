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
	killAppletServerIfRunningAndForceOption,
	SERVER_FORCE_OPTION,
	SERVER_PORT_OPTION,
	SERVER_PUBLIC_URL_OPTION,
} from '../../Applet/appletServerHelper';
import Debug from 'debug';

const debug = Debug('@signageos/cli:Device:Connect:connectCommand');

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
] as const;

export const connect = createCommandDefinition({
	name: 'connect',
	description: 'Set ip for device',
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

		await killAppletServerIfRunningAndForceOption(dev, options, appletUid, appletVersion, appletPort);

		const server = await dev.applet.serve.serve({
			appletUid,
			appletVersion,
			port: appletPort,
			publicUrl: appletPublicUrl,
		});
		debug('Server is running', server);
		const finalAppletPublicUrl = useForwardServer ? server.publicUrl : `http://${server.remoteAddr}:${server.port}`;
		const connection = await dev.deviceConnect.connect(deviceUid, {
			appletUid,
			appletVersion,
			appletPublicUrl: finalAppletPublicUrl,
		});

		const stopServer = async () => {
			await connection.disconnect();
			await server.stop();
			process.exit();
		};
		process.on('SIGINT', stopServer);
		process.on('SIGTERM', stopServer);

		console.info('Press Ctrl+C to disconnect');
		await wait(1e9); // Wait forever
	},
});
