import { createCommandDefinition } from '../Command/commandDefinition';
import { timingList } from './List/timingListCommand';

export const timing = createCommandDefinition({
	name: 'timing',
	description: 'Timing management',
	optionList: [],
	commands: [
		timingList,
	],
	async run() {
		throw new Error('Unknown command');
	},
});
