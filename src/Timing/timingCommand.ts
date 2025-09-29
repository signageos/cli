import { createCommandDefinition } from '../Command/commandDefinition';
import { timingList } from './List/timingListCommand';

/**
 * Provides commands for managing timing configurations that control when and how
 * applets are displayed on signageOS devices. Timing configurations define the
 * relationship between devices, applets, and scheduling parameters.
 *
 * @group Management:202
 *
 * @example
 * ```bash
 * # List timing configurations
 * sos timing list
 * ```
 *
 * @since 0.3.0
 */
export const timing = createCommandDefinition({
	name: 'timing',
	description: 'Timing management',
	optionList: [],
	commands: [timingList],
	async run() {
		throw new Error('Unknown command');
	},
});
