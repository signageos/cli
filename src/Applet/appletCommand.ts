import ICommand from "../Command/ICommand";
import { appletGenerate } from './Generate/appletGenerateCommand';
import { appletUpload } from './Upload/appletUploadCommand';
import { appletStart } from './Start/appletStartCommand';

export const applet: ICommand = {
	name: 'applet',
	description: 'Applet management',
	optionList: [],
	commands: [
		appletGenerate,
		appletUpload,
		appletStart,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
