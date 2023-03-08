import { getDeviceUid, connectDevice } from "../deviceFacade";
import { getOrganization, getOrganizationUidOrDefaultOrSelect, NO_DEFAULT_ORGANIZATION_OPTION, ORGANIZATION_UID_OPTION } from "../../Organization/organizationFacade";
import { createConnectFile, serveApplet, stopApplication } from "./connectHelper";
import { APPLET_PATH_OPTION, getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath } from "../../Applet/Upload/appletUploadCommandHelper";
import { APPLET_UID_OPTION, getAppletUid, getAppletVersion } from "../../Applet/appletFacade";
import { createOrganizationRestApi } from "../../helper";
import { CommandLineOptions, createCommandDefinition } from "../../Command/commandDefinition";
import { AppletDoesNotExistError } from "../../Applet/appletErrors";
import RestApi from "@signageos/sdk/dist/RestApi/RestApi";
import chalk from "chalk";

const OPTION_LIST = [
	NO_DEFAULT_ORGANIZATION_OPTION,
	ORGANIZATION_UID_OPTION,
	{ name: 'ip', type: String, description: 'Ip address of computer in local network' },
	{ name: 'device-uid', type: String, description: 'Uid of device from box' },
	APPLET_UID_OPTION,
	APPLET_PATH_OPTION,
] as const;

export const connect = createCommandDefinition({
	name: 'connect',
	description: 'Set ip for device',
	optionList: OPTION_LIST,
	commands: [],
	run: async function (options: CommandLineOptions<typeof OPTION_LIST>) {
		const currentDirectory = process.cwd();
		const projectDirAbsolutePath = await getProjectDirAbsolutePath(currentDirectory, options);
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = await createOrganizationRestApi(organization);
		const appletUid = await ensureAppletUid(restApi, options);
		const appletVersion = await getAppletVersion(currentDirectory);
		const deviceUid = await getDeviceUid(restApi, options);
		const deviceData = await restApi.device.get(deviceUid);
		await createConnectFile(deviceData.uid);
		const serverData  = await serveApplet(projectDirAbsolutePath, appletUid, appletVersion, deviceData);
		await connectDevice(organization, deviceData.uid, appletUid, appletVersion, serverData.serverPort);

		process.on('SIGINT', function () {
			stopApplication(organization, deviceData.uid);
		});
		process.on('SIGTERM', function () {
			stopApplication(organization, deviceData.uid);
		});
	},
});

async function ensureAppletUid(restApi: RestApi, options: CommandLineOptions<typeof OPTION_LIST>) {
	try {
		return await getAppletUid(restApi, options);
	} catch (error) {
		if (error instanceof AppletDoesNotExistError) {
			throw new Error(`Applet does not exist. Please use ${chalk.green('sos applet upload')} first.`);
		} else {
			throw error;
		}
	}
}
