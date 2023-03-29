import { DEVICE_UID_OPTION, getDeviceUid } from "../deviceFacade";
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from "../../Organization/organizationFacade";
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from "../../Applet/appletFacade";
import { createOrganizationRestApi } from "../../helper";
import { CommandLineOptions, createCommandDefinition } from "../../Command/commandDefinition";
import { createDevelopment } from "@signageos/sdk";
import wait from "../../Timer/wait";
import { log } from "@signageos/sdk/dist/Console/log";

const SERVER_PUBLIC_URL_OPTION = {
	name: 'server-public-url',
	type: String,
	description: 'Public url of local machine server. Is useful when the local machine is behind a reverse proxy.',
} as const;

const SERVER_PORT_OPTION = {
	name: 'server-port',
	type: Number,
	description: 'The custom server port for local machine server. Default is detected from currently running applet server.',
} as const;

const FORCE_OPTION = {
	name: 'force',
	type: Boolean,
	description: 'Force start applet server even if it is already running on a different port. Kill the running server first.',
} as const;

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	DEVICE_UID_OPTION,
	APPLET_UID_OPTION,
	SERVER_PUBLIC_URL_OPTION,
	SERVER_PORT_OPTION,
	FORCE_OPTION,
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
		const force = options[FORCE_OPTION.name];

		const runningAppletPort = await dev.applet.serve.getRunningPort(appletUid, appletVersion);
		if (runningAppletPort && runningAppletPort !== appletPort) {
			if (!force) {
				log('warning', `Applet server is already running on port ${runningAppletPort}. Use --force to kill the running server and start a new one.`);
			} else {
				await dev.applet.serve.killRunningServer(appletUid, appletVersion);
			}
		}

		const server = await dev.applet.serve.serve({
			appletUid,
			appletVersion,
			port: appletPort,
			publicUrl: appletPublicUrl,
		});
		const connection = await dev.deviceConnect.connect(deviceUid, {
			appletUid,
			appletVersion,
			appletPublicUrl: server.publicUrl,
		});

		const stopServer = async () => {
			await connection.disconnect();
			process.exit();
		};
		process.on('SIGINT', stopServer);
		process.on('SIGTERM', stopServer);

		console.info('Press Ctrl+C to disconnect');
		await wait(1e9); // Wait forever
	},
});
