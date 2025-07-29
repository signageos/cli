import { createCommandDefinition } from '../Command/commandDefinition';
import { firmwareUpload } from './Upload/firmwareUploadCommand';

/**
 * Provides commands for managing device firmware on the signageOS platform.
 * Firmware management includes uploading new firmware versions for different
 * device types and application platforms.
 *
 * @group Private
 *
 * @example
 * ```bash
 * # Upload firmware version
 * sos firmware upload
 * ```
 *
 * @see {@link ./upload/ Upload firmware version command}
 *
 * @since 0.6.0
 */
export const firmware = createCommandDefinition({
	name: 'firmware',
	description: 'Firmware management',
	optionList: [],
	commands: [firmwareUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
