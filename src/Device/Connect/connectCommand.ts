import { DEVICE_UID_OPTION, getDeviceUid } from "../deviceFacade";
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from "../../Organization/organizationFacade";
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from "../../Applet/appletFacade";
import { createOrganizationRestApi } from "../../helper";
import { CommandLineOptions, createCommandDefinition } from "../../Command/commandDefinition";
import { createDevelopment } from "@signageos/sdk";
import wait from "../../Timer/wait";
import { killAppletServerIfRunningAndForceOption, SERVER_FORCE_OPTION, SERVER_PORT_OPTION, SERVER_PUBLIC_URL_OPTION } from "../../Applet/appletServerHelper";

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	DEVICE_UID_OPTION,
	APPLET_UID_OPTION,
	SERVER_PUBLIC_URL_OPTION,
	SERVER_PORT_OPTION,
	SERVER_FORCE_OPTION,
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
		console.log("🚀 ~ file: connectCommand.ts:35 ~ appletUid:", appletUid)
		const appletVersion = await getAppletVersion(currentDirectory);
		console.log("🚀 ~ file: connectCommand.ts:37 ~ appletVersion:", appletVersion)
		const deviceUid = await getDeviceUid(restApi, options);

		const appletPort = options[SERVER_PORT_OPTION.name];
		console.log("🚀 ~ file: connectCommand.ts:41 ~ appletPort:", appletPort);
		const appletPublicUrl = options[SERVER_PUBLIC_URL_OPTION.name];
		console.log("🚀 ~ file: connectCommand.ts:40 ~ appletPublicUrl:", appletPublicUrl);

		await killAppletServerIfRunningAndForceOption(dev, options, appletUid, appletVersion, appletPort);

		const server = await dev.applet.serve.serve({
			appletUid,
			appletVersion,
			port: appletPort,
			publicUrl: appletPublicUrl,
		});
		console.log("🚀 ~ file: connectCommand.ts:53 ~ server:", server);
		const connection = await dev.deviceConnect.connect(deviceUid, {
			appletUid,
			appletVersion,
			appletPublicUrl: server.publicUrl,
		});
		console.log("🚀 ~ file: connectCommand.ts:59 ~ connection:", connection);

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
