import { DEVICE_UID_OPTION, getDeviceUid } from "../deviceFacade";
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from "../../Organization/organizationFacade";
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from "../../Applet/appletFacade";
import { createOrganizationRestApi } from "../../helper";
import { CommandLineOptions, createCommandDefinition } from "../../Command/commandDefinition";
import { createDevelopment } from "@signageos/sdk";
import { getMachineRemoteAddr } from '@signageos/sdk/dist/Utils/network';
import wait from "../../Timer/wait";

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

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	DEVICE_UID_OPTION,
	APPLET_UID_OPTION,
	SERVER_PUBLIC_URL_OPTION,
	SERVER_PORT_OPTION,
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

		const appletPort = options[SERVER_PORT_OPTION.name] ?? await dev.applet.serve.getRunningPort(appletUid, appletVersion);
		const appletPublicUrl = options[SERVER_PUBLIC_URL_OPTION.name] ?? `http://${getMachineRemoteAddr()}:${appletPort}`;

		const connection = await dev.deviceConnect.connect(deviceUid, {
			appletUid,
			appletVersion,
			appletPublicUrl,
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
