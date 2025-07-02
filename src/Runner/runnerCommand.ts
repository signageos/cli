import { createCommandDefinition } from '../Command/commandDefinition';
import { runnerGenerate } from './Generate/runnerGenerateCommand';
import { runnerUpload } from './Upload/runnerUploadCommand';

export const runner = createCommandDefinition({
	name: 'runner',
	description: 'Runner management',
	optionList: [],
	commands: [runnerGenerate, runnerUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
