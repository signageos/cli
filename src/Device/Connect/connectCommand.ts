import ICommand from "../../Command/ICommand";
import { getDeviceUid, connectDevice } from "../deviceFacade";
import { getOrganization, getOrganizationUidOrDefaultOrSelect } from "../../Organization/organizationFacade";
import { CommandLineOptions } from "command-line-args";
import { createConnectFile, serveApplet, stopApplication } from "./connectHelper";
import { getAppletDirectoryAbsolutePath as getProjectDirAbsolutePath } from "../../Applet/Upload/appletUploadCommandHelper";
import { getApplet } from "../../Applet/appletFacade";
import { createOrganizationRestApi } from "../../helper";

export const connect: ICommand = {
	name: 'connect',
	description: 'Set ip for device',
	optionList: [
		{ name: 'ip', type: String, description: 'Ip address of computer in local network' },
		{ name: 'device-uid', type: String, description: 'Uid of device from box' },
		{ name: 'applet-dir', type: String, description: 'Directory of the applet project' },
	],
	commands: [],
	run: async function (options: CommandLineOptions) {
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
};
