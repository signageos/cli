import { createCommandDefinition } from '../Command/commandDefinition';
import { firmwareUpload } from './Upload/firmwareUploadCommand';

export const firmware = createCommandDefinition({
	name: 'firmware',
	description: 'firmware management',
	optionList: [],
	commands: [firmwareUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
