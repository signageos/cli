import { getDeviceUid, connectDevice } from "../deviceFacade";
import { getOrganization, getOrganizationUidOrDefaultOrSelect, ORGANIZATION_UID_OPTION } from "../../Organization/organizationFacade";
import { createConnectFile, serveApplet, stopApplication } from "./connectHelper";
import { getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath } from "../../Applet/Upload/appletUploadCommandHelper";
import { getApplet } from "../../Applet/appletFacade";
import { createOrganizationRestApi } from "../../helper";
import { CommandLineOptions, createCommandDefinition } from "../../Command/commandDefinition";
import { APPLET_PATH_OPTION } from "../../Applet/Upload/appletUploadCommand";
import { GENERAL_OPTION_LIST } from "../../generalCommand";

const OPTION_LIST = [
	...GENERAL_OPTION_LIST,
	ORGANIZATION_UID_OPTION,
	{ name: 'ip', type: String, description: 'Ip address of computer in local network' },
	{ name: 'device-uid', type: String, description: 'Uid of device from box' },
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
		const appletData = await getApplet(projectDirAbsolutePath);
		const organizationUid = await getOrganizationUidOrDefaultOrSelect(options);
		const organization = await getOrganization(organizationUid);
		const restApi = createOrganizationRestApi(organization);
		const deviceUid = await getDeviceUid(restApi, options);
		const deviceData = await restApi.device.get(deviceUid);
		await createConnectFile(deviceData.uid);
		const serverData  = await serveApplet(projectDirAbsolutePath, appletData, deviceData);
		await connectDevice(organization, deviceData.uid, appletData, serverData.serverPort);

		process.on('SIGINT', function () {
			stopApplication(organization, deviceData.uid);
		});
		process.on('SIGTERM', function () {
			stopApplication(organization, deviceData.uid);
		});
	},
});
