import ICommand from "../Command/ICommand";
import { setContent } from './Content/setContentCommand';
import { powerAction } from "./PowerAction/powerActionCommand";

export const device: ICommand = {
	name: 'device',
	description: 'device management',
	optionList: [
	],
	commands: [
		setContent,
		powerAction,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
