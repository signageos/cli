import { createCommandDefinition } from '../Command/commandDefinition';
import { customScriptUpload } from './Upload/customScriptUploadCommand';
import { customScriptGenerate } from './Generate/customScriptGenerateCommand';

export const customScript = createCommandDefinition({
	name: 'custom-script',
	description: 'Custom Script management',
	optionList: [],
	commands: [customScriptUpload, customScriptGenerate],
	async run() {
		throw new Error('Unknown command');
	},
});
