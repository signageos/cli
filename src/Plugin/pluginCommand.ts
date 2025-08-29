import { createCommandDefinition } from '../Command/commandDefinition';
import { pluginGenerate } from './Generate/pluginGenerateCommand';
import { pluginUpload } from './Upload/pluginUploadCommand';

export const plugin = createCommandDefinition({
	name: 'plugin',
	description: 'Plugin management',
	optionList: [],
	commands: [pluginGenerate, pluginUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
