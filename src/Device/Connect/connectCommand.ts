import chalk from 'chalk';
import ICommand from "../../Command/ICommand";
import { getDeviceUid, sendIpToDevice } from "../deviceFacade";
import { getOrganization, getOrganizationUid } from "../../Organization/organizationFacade";
import { CommandLineOptions } from "command-line-args";
import { getComputerIp, serveApplet } from "./connectHelper";

export const connect: ICommand = {
	name: 'connect',
	description: 'Set ip for device',
	optionList: [
		{ name: 'ip', type: String, description: 'Ip address of computer in local network' },
		{ name: 'applet-uid', type: String, description: 'Uid of applet form box' },
		{ name: 'device-uid', type: String, description: 'Uid of device from box' },
	],
	commands: [],
	async run(options: CommandLineOptions) {
		const computerIpEt0 = await getComputerIp();
		const organizationUid = await getOrganizationUid(options);
		const organization = await getOrganization(organizationUid);
		const deviceUid = await getDeviceUid(organization, options);
		const response = await sendIpToDevice(organization, deviceUid, "fbdabe9bba0613c62dba2db6047a49585264851bf7b9518aa9", computerIpEt0);
		await serveApplet("/Users/patrikbily/Dokumety_bezIC/Work/signageos/applet-examples/examples/framework-examples/vue-example/");

		console.log(chalk.green(JSON.stringify(response, undefined, 2)));
		console.log(chalk.green(JSON.stringify(computerIpEt0, undefined, 2)));
		console.log(chalk.green(JSON.stringify(deviceUid, undefined, 2)));
	},
};
