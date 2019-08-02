import { CommandLineOptions } from "command-line-args";

export const appletInit = {
	name: 'init',
	optionList: [
		{ name: 'name', type: String, description: 'Applet name' },
	],
	commands: [],
	async run(options: CommandLineOptions) {
		if (!options.name) {
			throw new Error(`Missing argument --name <string>`);
		}

	},
};
