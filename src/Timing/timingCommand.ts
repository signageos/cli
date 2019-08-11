import ICommand from "../Command/ICommand";
import { timingList } from './List/timingListCommand';

export const timing: ICommand = {
	name: 'timing',
	description: 'Timing management',
	optionList: [],
	commands: [
		timingList,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
