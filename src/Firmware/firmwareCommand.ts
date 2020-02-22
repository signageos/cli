import ICommand from "../Command/ICommand";
import { firmwareUpload } from './Upload/firmwareUploadCommand';

export const firmware: ICommand = {
	name: 'firmware',
	description: 'firmware management',
	optionList: [
		{ name: 'application-type', alias: 'a', type: String, },
		{ name: 'firmware-version', alias: 'f', type: String, },
		{ name: 'src', type: String, multiple: true, },
	],
	commands: [
		firmwareUpload,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
