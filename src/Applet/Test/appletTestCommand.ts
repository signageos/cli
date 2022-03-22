import { createCommandDefinition } from "../../Command/commandDefinition";
import { appletTestRun } from "./Upload/appletTestRunCommand";
import { appletTestUpload } from "./Upload/appletTestUploadCommand";

export const appletTest = createCommandDefinition({
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
});
