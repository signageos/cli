import { createCommandDefinition } from '../Command/commandDefinition';
import { customScriptUpload } from './Upload/customScriptUploadCommand';
import { customScriptGenerate } from './Generate/customScriptGenerateCommand';

/**
 * Custom Scripts management for advanced device operations.
 *
 * Allows sending OS-specific scripts with native API access to signageOS devices.
 * Supports JavaScript (browser), PowerShell (Windows), Bash/Shell (Linux/Android).
 *
 * @group Development:101
 *
 * @example
 * ```bash
 * # Generate new project
 * sos custom-script generate
 *
 * # Upload to platform
 * sos custom-script upload
 * ```
 *
 * @see {@link https://developers.signageos.io/docs/custom-scripts/ Documentation}
 * @see {@link https://developers.signageos.io/docs/custom-scripts/#config-file Config File}
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
