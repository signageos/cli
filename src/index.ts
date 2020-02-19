#!/usr/bin/env node

import ICommand from './Command/ICommand';
import { applet } from './Applet/appletCommand';
import { login } from './Auth/loginCommand';
import { organization } from './Organization/organizationCommand';
import { timing } from './Timing/timingCommand';
import { processCommand, API_URL_OPTION } from './Command/commandProcessor';
import { VERSION_OPTION } from './Cli/packageVersion';
import { firmware } from './Firmware/firmwareCommand';

const index: ICommand = {
	name: 'sos',
	description: 'signageOS',
	optionList: [
		{
			name: 'command',
			alias: 'c',
			type: String,
			multiple: true,
			defaultOption: true,
			defaultValue: [],
			description: `(default) Command name`,
		},
		{ name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.' },
		API_URL_OPTION,
		VERSION_OPTION,
	],
	commands: [
		applet,
		login,
		organization,
		timing,
		firmware,
	],
	async run() {
		throw new Error('Unknown command');
	},
};

processCommand(index);
