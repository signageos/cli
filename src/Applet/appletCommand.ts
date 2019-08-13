import ICommand from "../Command/ICommand";
import { appletGenerate } from './Generate/appletGenerateCommand';

export const applet: ICommand = {
	name: 'applet',
	description: 'Applet management',
	optionList: [],
	commands: [
		appletGenerate,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
