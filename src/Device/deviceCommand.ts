import ICommand from "../Command/ICommand";
import { setContent } from './Content/setContentCommand';
import { powerAction } from "./PowerAction/powerActionCommand";
import { connect } from "./Connect/connectCommand";

export const device: ICommand = {
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
};
