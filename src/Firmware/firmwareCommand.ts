import ICommand from "../Command/ICommand";
import { firmwareUpload } from './Upload/firmwareUploadCommand';

export const firmware: ICommand = {
	name: 'firmware',
	description: 'firmware management',
	optionList: [],
	commands: [
		firmwareUpload,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
