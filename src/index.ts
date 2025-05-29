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
import { customScript } from './CustomScript/customScriptCommand';
import { autocomplete, initializeAutocomplete } from './Command/Autocomplete/autocompleteCommand';

const index = createCommandDefinition({
	name: 'sos',
	description: 'signageOS',
	optionList: GENERAL_OPTION_LIST,
	commands: [applet, login, organization, timing, firmware, device, customScript, autocomplete],
	async run() {
		throw new Error('Unknown command');
	},
});

// Initialize autocomplete with root command reference using dependency injection
initializeAutocomplete(index);

processCommand(index).catch((err) => {
	throw new Error('Unknown error:', err);
});
