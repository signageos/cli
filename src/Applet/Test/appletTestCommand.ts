import ICommand from "../../Command/ICommand";
import { appletTestUpload } from "./Upload/appletTestUploadCommand";

export const appletTest: ICommand = {
	name: 'test',
	description: 'Applet test management',
	optionList: [],
	commands: [
		appletTestUpload,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
