import { setContent } from './Content/setContentCommand';
import { powerAction } from './PowerAction/powerActionCommand';
import { connect } from './Connect/connectCommand';
import { createCommandDefinition } from '../Command/commandDefinition';

/**
 * Provides commands for managing signageOS devices, including connecting to devices
 * for development, controlling device power states, and managing applet deployment.
 *
 * @group Management:3
 *
 * @example
 * ```bash
 * # Connect to device for development
 * sos device connect --device-uid device123
 *
 * # Control device power actions
 * sos device power-action reload --device-uid device123
 *
 * # Deploy applet to device
 * sos device set-content --device-uid device123
 * ```
 *
 * @since 0.9.0
 */
export const device = createCommandDefinition({
	name: 'device',
	description: 'Device management',
	optionList: [],
	commands: [setContent, powerAction, connect],
	async run() {
		throw new Error('Unknown command');
	},
});
