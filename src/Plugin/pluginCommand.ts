import { createCommandDefinition } from '../Command/commandDefinition';
import { pluginGenerate } from './Generate/pluginGenerateCommand';
import { pluginUpload } from './Upload/pluginUploadCommand';

/**
 * Plugin management operations for developing and deploying signageOS plugins.
 *
 * Plugins extend native signageOS features and integrate with system policies.
 * They run periodically to ensure configuration is consistently enforced on devices.
 *
 * Plugins must implement `set` and `get` methods.
 * Upload reads `.sosconfig.json` for configuration.
 *
 * @group Development:102
 *
 * @example
 * ```bash
 * # Generate a new plugin project interactively
 * sos plugin generate
 *
 * # Generate plugin with all parameters (non-interactive, suitable for CI/CD)
 * sos plugin generate --name my-plugin --description "Custom functionality" --yes
 *
 * # Upload plugin to signageOS platform
 * sos plugin upload
 *
 * # Upload plugin non-interactively (for CI/CD pipelines)
 * sos plugin upload --yes
 *
 * # Upload with specific organization
 * sos plugin upload --organization-uid abc123def456
 * ```
 *
 * @since 2.6.0
 */
export const plugin = createCommandDefinition({
	name: 'plugin',
	description: 'Plugin management',
	optionList: [],
	commands: [pluginGenerate, pluginUpload],
	async run() {
		throw new Error('Unknown command');
	},
});
