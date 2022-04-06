import { setContent } from './Content/setContentCommand';
import { powerAction } from "./PowerAction/powerActionCommand";
import { connect } from "./Connect/connectCommand";
import { createCommandDefinition } from '../Command/commandDefinition';

export const device = createCommandDefinition({
	name: 'device',
	description: 'device management',
	optionList: [
	],
	commands: [
		setContent,
		powerAction,
		connect,
	],
	async run() {
		throw new Error('Unknown command');
	},
});
