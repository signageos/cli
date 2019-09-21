import ICommand from "../Command/ICommand";
import { appletGenerate } from './Generate/appletGenerateCommand';
import { appletUpload } from './Upload/appletUploadCommand';

export const applet: ICommand = {
	name: 'applet',
	description: 'Applet management',
	optionList: [],
	commands: [
		appletGenerate,
		appletUpload,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
