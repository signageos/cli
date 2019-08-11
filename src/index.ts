#!/usr/bin/env node

import ICommand from './Command/ICommand';
import * as parameters from '../config/parameters';
import { applet } from './Applet/appletCommand';
import { login } from './Auth/loginCommand';
import { organization } from './Organization/organizationCommand';
import { timing } from './Timing/timingCommand';
import { processCommand } from './Command/commandProcessor';

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
		{ name: 'api-url', alias: 'u', type: String, defaultValue: parameters.apiUrl, description: 'API URL to be used for REST requests' },
	],
	commands: [
		applet,
		login,
		organization,
		timing,
	],
	async run() {
		throw new Error('Unknown command');
	},
};

processCommand(index);
