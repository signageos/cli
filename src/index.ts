#!/usr/bin/env node

import { applet } from './Applet/appletCommand';
import { login } from './Auth/loginCommand';
import { organization } from './Organization/organizationCommand';
import { timing } from './Timing/timingCommand';
import { processCommand } from './Command/commandProcessor';
import { firmware } from './Firmware/firmwareCommand';
import { device } from './Device/deviceCommand';
import { GENERAL_OPTION_LIST } from './generalCommand';
import { createCommandDefinition } from './Command/commandDefinition';

const index = createCommandDefinition({
	name: 'sos',
	description: 'signageOS',
	optionList: GENERAL_OPTION_LIST,
	commands: [applet, login, organization, timing, firmware, device],
	async run() {
		throw new Error('Unknown command');
	},
});

processCommand(index);
