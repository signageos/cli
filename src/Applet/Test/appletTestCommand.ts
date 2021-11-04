import ICommand from "../../Command/ICommand";
import { appletTestRun } from "./Upload/appletTestRunCommand";
import { appletTestUpload } from "./Upload/appletTestUploadCommand";

export const appletTest: ICommand = {
	name: 'test',
	description: 'Applet test management',
	optionList: [],
	commands: [
		appletTestUpload,
		appletTestRun,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
