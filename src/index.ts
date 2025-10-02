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
import { plugin } from './Plugin/pluginCommand';
import { runner } from './Runner/runnerCommand';
import { autocomplete, initializeAutocomplete } from './Command/Autocomplete/autocompleteCommand';

/**
 * The root command for the signageOS CLI tool that provides comprehensive management
 * capabilities for applets, devices, organizations, and other signageOS resources.
 * This command serves as the entry point for all CLI operations and coordinates
 * access to all available command groups.
 *
 * @example
 * ```bash
 * # Show help and available commands
 * sos --help
 *
 * # Show version information
 * sos --version
 *
 * # Use custom API endpoint
 * sos --api-url https://api.custom.signageos.io applet list
 * ```
 *
 * @see {@link https://developers.signageos.io/docs/cli-setup/ CLI Setup}
 *
 * @since 0.1.0
 */
const index = createCommandDefinition({
	name: 'sos',
	description: 'SignageOS CLI - The central command-line tool for deploying, managing, and debugging signageOS projects and devices',
	optionList: GENERAL_OPTION_LIST,
	commands: [applet, login, organization, timing, firmware, device, customScript, plugin, runner, autocomplete],
	async run() {
		throw new Error('Unknown command');
	},
});

// Initialize autocomplete with root command reference using dependency injection
initializeAutocomplete(index);

processCommand(index).catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
