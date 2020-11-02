import ICommand from "../Command/ICommand";
import { powerAction } from "./PowerAction/powerActionCommand";

export const device: ICommand = {
	name: 'device',
	description: 'device management',
	optionList: [
	],
	commands: [
		powerAction,
	],
	async run() {
		throw new Error('Unknown command');
	},
};
