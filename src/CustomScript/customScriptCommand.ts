import { createCommandDefinition } from '../Command/commandDefinition';
import { customScriptUpload } from './Upload/customScriptUploadCommand';

export const customScript = createCommandDefinition({
	name: 'custom-script',
	description: 'Custom Script management',
	optionList: [],
	commands: [customScriptUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
