import { createCommandDefinition } from '../Command/commandDefinition';
import { customScriptUpload } from './Upload/customScriptUploadCommand';
import { customScriptGenerate } from './Generate/customScriptGenerateCommand';

/**
 * Provides commands for developing and deploying custom scripts to signageOS devices.
 * Custom Scripts enable advanced device functionality beyond standard applets,
 * including system-level operations and device-specific configurations.
 *
 * @group Development:5
 *
 * @example
 * ```bash
 * # Generate new custom script project
 * sos custom-script generate
 *
 * # Upload custom script to platform
 * sos custom-script upload
 * ```
 *
 * @see {@link https://developers.signageos.io/docs/custom-scripts/ Custom Scripts Documentation}
 *
 * @since 1.8.0
 */
export const customScript = createCommandDefinition({
	name: 'custom-script',
	description: 'Custom Script management',
	optionList: [],
	commands: [customScriptUpload, customScriptGenerate],
	async run() {
		throw new Error('Unknown command');
	},
});
